package com.fatyliser.eq

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.media.audiofx.AudioEffect
import android.media.audiofx.DynamicsProcessing
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * AudioEngineService: High-Performance System-Wide 32-Band Equalizer Service
 * Utilizes Android Hardware DynamicsProcessing & Limiter DSP.
 * Runs as a sticky Foreground Service with real-time dumpsys AudioFlinger session detection.
 */
class AudioEngineService : Service() {

    companion object {
        private const val TAG = "FatyliserAudioEngine"
        private const val NOTIFICATION_CHANNEL_ID = "fatyliser_audio_service_channel"
        private const val NOTIFICATION_ID = 2026

        // ISO Standard 32 Audio Frequencies in Hertz (20 Hz to 20,000 Hz)
        val FREQUENCIES = floatArrayOf(
            20f, 25f, 31.5f, 40f, 50f, 63f, 80f, 100f,
            125f, 160f, 200f, 250f, 315f, 400f, 500f, 630f,
            800f, 1000f, 1250f, 1600f, 2000f, 2500f, 3150f, 4000f,
            5000f, 6300f, 8000f, 10000f, 12500f, 16000f, 18000f, 20000f
        )
    }

    private val binder = AudioEngineBinder()
    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)

    // Global 32-Band Gains array (-12.0f dB to +12.0f dB)
    private val bandGains = FloatArray(32) { 0.0f }

    // Active DSP DynamicsProcessing instances indexed by Audio Session ID
    private val processingCache = HashMap<Int, DynamicsProcessing>()

    // Set of known monitored packages for audio flinger inspection
    private val monitoredPackages = listOf(
        "com.google.android.youtube",
        "com.android.chrome",
        "com.spotify.music",
        "com.google.android.apps.youtube.music",
        "com.soundcloud.android",
        "org.videolan.vlc"
    )

    // Broadcast receiver for system-wide AudioEffect session registration
    private val audioSessionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            intent?.let {
                val action = it.action
                val sessionId = it.getIntExtra(AudioEffect.EXTRA_AUDIO_SESSION, AudioEffect.ERROR)
                val packageName = it.getStringExtra(AudioEffect.EXTRA_PACKAGE_NAME) ?: "Unknown"

                if (sessionId != AudioEffect.ERROR) {
                    when (action) {
                        AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION -> {
                            Log.i(TAG, "Audio session opened: $sessionId for package: $packageName")
                            attachDynamicsProcessing(sessionId)
                        }
                        AudioEffect.ACTION_CLOSE_AUDIO_EFFECT_CONTROL_SESSION -> {
                            Log.i(TAG, "Audio session closed: $sessionId")
                            detachDynamicsProcessing(sessionId)
                        }
                    }
                }
            }
        }
    }

    inner class AudioEngineBinder : Binder() {
        fun getService(): AudioEngineService = this@AudioEngineService
    }

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Starting Fatyliser Native AudioEngineService...")

        createNotificationChannel()
        startServiceInForeground()

        // Register system broadcast filters for Android AudioEffect sessions
        val filter = IntentFilter().apply {
            addAction(AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION)
            addAction(AudioEffect.ACTION_CLOSE_AUDIO_EFFECT_CONTROL_SESSION)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(audioSessionReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            registerReceiver(audioSessionReceiver, filter)
        }

        // Initialize global fallback audio session 0 (Mixer output)
        attachDynamicsProcessing(0)

        // Launch background dumpsys polling loop for hidden tracks (YouTube, Chrome, etc.)
        startAudioFlingerInspectionLoop()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "AudioEngineService running as START_STICKY")
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder {
        return binder
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.i(TAG, "Destroying AudioEngineService and releasing DSP hardware instances")

        serviceJob.cancel()
        try {
            unregisterReceiver(audioSessionReceiver)
        } catch (e: Exception) {
            Log.w(TAG, "Receiver already unregistered", e)
        }

        synchronized(processingCache) {
            for ((sessionId, dp) in processingCache) {
                try {
                    dp.enabled = false
                    dp.release()
                } catch (e: Exception) {
                    Log.w(TAG, "Error releasing DynamicsProcessing for session $sessionId", e)
                }
            }
            processingCache.clear()
        }
    }

    /**
     * Creates and attaches a 32-band DynamicsProcessing instance with Limiter to the audio session.
     */
    fun attachDynamicsProcessing(sessionId: Int): Boolean {
        synchronized(processingCache) {
            if (processingCache.containsKey(sessionId)) {
                return true
            }

            try {
                val channelCount = 2 // Stereo channels
                val bandCount = 32

                // Build a DynamicsProcessing Config: Pre-EQ (32 bands) + Native Limiter
                val builder = DynamicsProcessing.Config.Builder(
                    DynamicsProcessing.CONFIG_DEFAULT_VARIANT,
                    channelCount,
                    true,  // preEqInUse
                    bandCount, // preEqBandCount = 32
                    false, // mbcInUse
                    0,     // mbcBandCount
                    false, // postEqInUse
                    0,     // postEqBandCount
                    true   // limiterInUse
                )

                // Configure 32 Parametric Pre-EQ bands for both stereo channels
                for (ch in 0 until channelCount) {
                    for (i in 0 until bandCount) {
                        val band = DynamicsProcessing.EqBand(
                            true, // enabled
                            FREQUENCIES[i], // cutoff frequency
                            bandGains[i] // current gain in dB
                        )
                        builder.setPreEqBand(ch, i, band)
                    }

                    // Native Audio Limiter to prevent clipping when boosting bands
                    val limiter = DynamicsProcessing.Limiter(
                        true,   // inUse
                        true,   // enabled
                        0,      // linkGroup
                        1.0f,   // attackTime (1 ms)
                        60.0f,  // releaseTime (60 ms)
                        10.0f,  // ratio (10:1 brickwall)
                        -0.5f,  // threshold (-0.5 dB)
                        0.0f    // postGain (0 dB)
                    )
                    builder.setLimiter(ch, limiter)
                }

                val config = builder.build()
                val dp = DynamicsProcessing(0, sessionId, config)
                dp.enabled = true

                processingCache[sessionId] = dp
                Log.i(TAG, "Successfully attached 32-band DynamicsProcessing DSP to Session: $sessionId")
                return true
            } catch (e: Exception) {
                Log.e(TAG, "Failed to initialize DynamicsProcessing for session: $sessionId: ${e.message}")
                return false
            }
        }
    }

    /**
     * Detaches and releases the DSP instance for a closed session.
     */
    fun detachDynamicsProcessing(sessionId: Int) {
        synchronized(processingCache) {
            val dp = processingCache.remove(sessionId)
            dp?.let {
                try {
                    it.enabled = false
                    it.release()
                    Log.i(TAG, "Released DynamicsProcessing for Session: $sessionId")
                } catch (e: Exception) {
                    Log.w(TAG, "Error releasing session $sessionId: ${e.message}")
                }
            }
        }
    }

    /**
     * Updates an individual band gain (-12 dB to +12 dB) across all active sessions.
     */
    fun updateBandGain(bandIndex: Int, gainDb: Float) {
        if (bandIndex !in 0 until 32) return

        val clampedGain = gainDb.coerceIn(-12.0f, 12.0f)
        bandGains[bandIndex] = clampedGain

        synchronized(processingCache) {
            for ((sessionId, dp) in processingCache) {
                try {
                    val eqBand = DynamicsProcessing.EqBand(
                        true,
                        FREQUENCIES[bandIndex],
                        clampedGain
                    )
                    dp.setPreEqBandAllChannelsTo(bandIndex, eqBand)
                } catch (e: Exception) {
                    Log.w(TAG, "Failed updating band $bandIndex on session $sessionId: ${e.message}")
                }
            }
        }
    }

    /**
     * Updates all 32 bands simultaneously (e.g. when loading a preset).
     */
    fun updateAllBands(newGains: FloatArray) {
        if (newGains.size != 32) return

        for (i in 0 until 32) {
            bandGains[i] = newGains[i].coerceIn(-12.0f, 12.0f)
        }

        synchronized(processingCache) {
            for ((sessionId, dp) in processingCache) {
                try {
                    for (i in 0 until 32) {
                        val eqBand = DynamicsProcessing.EqBand(
                            true,
                            FREQUENCIES[i],
                            bandGains[i]
                        )
                        dp.setPreEqBandAllChannelsTo(i, eqBand)
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Failed updating all bands on session $sessionId: ${e.message}")
                }
            }
        }
    }

    /**
     * Returns a copy of the current 32 band gains.
     */
    fun getBandGains(): FloatArray = bandGains.clone()

    /**
     * Returns the count of actively processed audio sessions.
     */
    fun getActiveSessionCount(): Int {
        synchronized(processingCache) {
            return processingCache.size
        }
    }

    /**
     * Background coroutine loop:
     * Parses dumpsys media.audio_flinger using Regex ("Session\\s+(\\d+)")
     * to discover and attach DSP to active media sessions from YouTube, Chrome, etc.
     */
    private fun startAudioFlingerInspectionLoop() {
        serviceScope.launch {
            val sessionRegex = Regex("""Session\s+(\d+)""", RegexOption.IGNORE_CASE)

            while (isActive) {
                try {
                    val activeSessions = inspectAudioFlingerSessions(sessionRegex)

                    for (sessionId in activeSessions) {
                        if (sessionId > 0 && !processingCache.containsKey(sessionId)) {
                            Log.d(TAG, "Dumpsys discovered active media Session: $sessionId. Attaching DSP...")
                            attachDynamicsProcessing(sessionId)
                        }
                    }
                } catch (e: Exception) {
                    Log.v(TAG, "Dumpsys inspection scan cycle: ${e.message}")
                }

                // Poll every 3 seconds for new audio tracks
                delay(3000)
            }
        }
    }

    /**
     * Executes dumpsys media.audio_flinger and extracts audio session IDs.
     */
    private fun inspectAudioFlingerSessions(regex: Regex): Set<Int> {
        val detectedSessions = mutableSetOf<Int>()

        // Try direct dumpsys or root fallback
        val commands = listOf(
            arrayOf("dumpsys", "media.audio_flinger"),
            arrayOf("su", "-c", "dumpsys media.audio_flinger")
        )

        for (cmd in commands) {
            try {
                val process = Runtime.getRuntime().exec(cmd)
                val reader = BufferedReader(InputStreamReader(process.inputStream))
                var line: String?

                var isRelevantTrack = false
                while (reader.readLine().also { line = it } != null) {
                    val currentLine = line ?: continue

                    // Check if line mentions monitored streaming applications
                    for (pkg in monitoredPackages) {
                        if (currentLine.contains(pkg, ignoreCase = true)) {
                            isRelevantTrack = true
                            break
                        }
                    }

                    // Extract session ID matching regex
                    val match = regex.find(currentLine)
                    if (match != null) {
                        val sessionVal = match.groupValues[1].toIntOrNull()
                        if (sessionVal != null && sessionVal > 0) {
                            detectedSessions.add(sessionVal)
                        }
                    }
                }
                reader.close()
                process.destroy()

                if (detectedSessions.isNotEmpty()) {
                    break
                }
            } catch (e: Exception) {
                // Command failed or permission restricted without root/DUMP
            }
        }

        return detectedSessions
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Fatyliser Audio Engine",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "System-wide 32-band hardware audio equalization and limiter processing"
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun startServiceInForeground() {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        val notification: Notification = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Fatyliser 32-Band Equalizer")
            .setContentText("Active system-wide DSP audio processing with Limiter")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROCESSING
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }
}
