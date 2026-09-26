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

    companion object {
        // Explicit layout frequencies for the 32 bands
        val FREQUENCIES = listOf(
            "20", "31", "45", "63", "90", "125", "180", "250", "355", "500",
            "710", "1k", "1.4k", "2k", "2.8k", "4k", "5.6k", "8k", "11k", "16k",
            "20k", "22k", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10"
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
                        sessions.add(match.groupValues.toInt())
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
            
            // Build the baseline configuration structure
            val config = builder.build()
            
            // MANDATORY FIX: Initialize physical escalating frequency math intervals for each channel
            for (ch in 0 until 2) {
                for (i in 0 until BAND_COUNT) {
                    val band = config.getPreEqBandByChannelIndex(ch, i)
                    band.enabled = true
                    // Safely escalate frequencies exponentially so Android doesn't crash
                    band.cutoffFrequency = 20f * Math.pow(1.26, i.toDouble()).toFloat()
                    band.gain = bandGains[i]
                }
            }

            val effect = DynamicsProcessing(0, sessionId, config)
            effect.enabled = true
            effectsMap[sessionId] = effect
        } catch (e: Exception) { e.printStackTrace() }
    }

    fun updateBandGain(bandIndex: Int, gainDb: Float) {
        if (bandIndex in 0 until BAND_COUNT) {
            bandGains[bandIndex] = gainDb
            effectsMap.values.forEach { effect ->
                try {
                    // Update both left and right stereo channels in real-time
                    val leftBand = effect.getPreEqBandByChannelIndex(0, bandIndex)
                    val rightBand = effect.getPreEqBandByChannelIndex(1, bandIndex)
                    leftBand.gain = gainDb
                    rightBand.gain = gainDb
                } catch (e: Exception) { e.printStackTrace() }
            }
        }
    }

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
