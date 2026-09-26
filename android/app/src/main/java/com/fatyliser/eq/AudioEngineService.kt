package com.fatyliser.eq

import android.app.*
import android.content.Intent
import android.media.audiofx.DynamicsProcessing
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import java.io.BufferedReader
import java.io.InputStreamReader

class AudioEngineService : Service() {

    private val binder = AudioEngineBinder()
    private val effectsMap = HashMap<Int, DynamicsProcessing>()
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val BAND_COUNT = 32
    private val bandGains = FloatArray(BAND_COUNT) { 0.0f }

    // Exposing the exact companion reference expected by MainActivity
    companion object {
        val FREQUENCIES = listOf(
            "31", "45", "62", "90", "125", "180", "250", "350", "500", "700",
            "1k", "1.4k", "2k", "2.8k", "4k", "5.6k", "8k", "11k", "16k", "22k",
            "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11", "B12"
        )
    }

    inner class AudioEngineBinder : Binder() {
        fun getService(): AudioEngineService = this@AudioEngineService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        startForeground(1, createNotification())
        startTrackingYouTube()
    }

    private fun startTrackingYouTube() {
        serviceScope.launch {
            while (isActive) {
                val sessionIds = scrapeYouTubeSessions()
                withContext(Dispatchers.Main) {
                    sessionIds.forEach { id -> applyEqualizerToSession(id) }
                }
                delay(2000)
            }
        }
    }

    private fun scrapeYouTubeSessions(): List<Int> {
        val sessions = mutableListOf<Int>()
        try {
            val process = Runtime.getRuntime().exec("dumpsys media.audio_flinger")
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            var line: String? = reader.readLine()
            val sessionPattern = Regex("""Session\s+(\d+)""")

            while (line != null) {
                val currentLine = line ?: ""
                if (currentLine.contains("com.google.android.youtube") || currentLine.contains("youtube")) {
                    sessionPattern.find(currentLine)?.let { match ->
                        sessions.add(match.groupValues[1].toInt())
                    }
                }
                line = reader.readLine()
            }
            reader.close()
        } catch (e: Exception) { e.printStackTrace() }
        return sessions
    }

    private fun applyEqualizerToSession(sessionId: Int) {
        if (effectsMap.containsKey(sessionId)) return
        try {
            val builder = DynamicsProcessing.Config.Builder(
                DynamicsProcessing.VARIANT_FAVOR_FREQUENCY_RESOLUTION,
                2, true, BAND_COUNT, false, 0, false, 0, true
            )
            val effect = DynamicsProcessing(0, sessionId, builder.build())
            effect.enabled = true
            
            for (i in 0 until BAND_COUNT) {
                try {
                    val eqBand = effect.getPreEqBandByChannelIndex(0, i)
                    eqBand.gain = bandGains[i]
                } catch (e: Exception) { e.printStackTrace() }
            }
            effectsMap[sessionId] = effect
        } catch (e: Exception) { e.printStackTrace() }
    }

    fun updateBandGain(bandIndex: Int, gainDb: Float) {
        if (bandIndex in 0 until BAND_COUNT) {
            bandGains[bandIndex] = gainDb
            effectsMap.values.forEach { effect ->
                try {
                    val eqBand = effect.getPreEqBandByChannelIndex(0, bandIndex)
                    eqBand.gain = gainDb
                } catch (e: Exception) { e.printStackTrace() }
            }
        }
    }

    // Expose layout helpers expected by MainActivity mapping logic
    fun getBandGains(): FloatArray = bandGains
    fun getActiveSessionCount(): Int = effectsMap.size
    
    fun updateAllBands(newGains: FloatArray) {
        for (i in 0 until BAND_COUNT.coerceAtMost(newGains.size)) {
            updateBandGain(i, newGains[i])
        }
    }

    private fun createNotification(): Notification {
        val channelId = "FatyliserChannel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Fatyliser Processing", NotificationManager.IMPORTANCE_LOW)
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("Fatyliser Engine Running")
            .setContentText("Processing system media in the background...")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .build()
    }

    override fun onDestroy() {
        serviceScope.cancel()
        effectsMap.values.forEach { it.enabled = false; it.release() }
        effectsMap.clear()
        super.onDestroy()
    }
}
