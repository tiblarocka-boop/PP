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
        val FREQUENCIES = listOf(
            "20", "31", "45", "63", "90", "125", "180", "250", "355", "500",
            "710", "1k", "1.4k", "2k", "2.8k", "4k", "5.6k", "8k", "11k", "16k",
            "20k", "21k", "22k", "23k", "24k", "B1", "B2", "B3", "B4", "B5", "B6", "B7"
        )
    }

    inner class AudioEngineBinder : Binder() {
        fun getService(): AudioEngineService = this@AudioEngineService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        try {
            startForeground(1, createNotification())
        } catch (e: Exception) {
            e.printStackTrace()
        }
        startTrackingYouTube()
    }

    private fun startTrackingYouTube() {
        serviceScope.launch {
            while (isActive) {
                try {
                    val sessionIds = scrapeYouTubeSessions()
                    withContext(Dispatchers.Main) {
                        sessionIds.forEach { id -> applyEqualizerToSession(id) }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
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
                val currentLine = line
                if (currentLine.contains("com.google.android.youtube") || currentLine.contains("youtube")) {
                    sessionPattern.find(currentLine)?.let { match ->
                        val extractedId = match.groupValues[1].toInt()
                        sessions.add(extractedId)
                    }
                }
                line = reader.readLine()
            }
            reader.close()
        } catch (e: Exception) { 
            e.printStackTrace() 
        }
        return sessions
    }

    private fun applyEqualizerToSession(sessionId: Int) {
        if (effectsMap.containsKey(sessionId) || sessionId <= 0) return
        try {
            val builder = DynamicsProcessing.Config.Builder(
                DynamicsProcessing.VARIANT_FAVOR_FREQUENCY_RESOLUTION,
                2, true, BAND_COUNT, false, 0, false, 0, true
            )
            
            val config = builder.build()
            
            for (ch in 0 until 2) {
                var lastCutoff = 20f
                for (i in 0 until BAND_COUNT) {
                    try {
                        val band = config.getPreEqBandByChannelIndex(ch, i)
                        val calculatedCutoff = 20f * Math.pow(1.25, i.toDouble()).toFloat()
                        if (calculatedCutoff > lastCutoff) {
                            band.cutoffFrequency = calculatedCutoff
                            lastCutoff = calculatedCutoff
                        } else {
                            band.cutoffFrequency = lastCutoff + 10f
                            lastCutoff += 10f
                        }
                        band.gain = bandGains[i]
                    } catch (e: Exception) { e.printStackTrace() }
                }
            }

            val effect = DynamicsProcessing(0, sessionId, config)
            effect.enabled = true
            effectsMap[sessionId] = effect
        } catch (e: Exception) { 
            e.printStackTrace() 
        }
    }

    fun updateBandGain(bandIndex: Int, gainDb: Float) {
        if (bandIndex in 0 until BAND_COUNT) {
            bandGains[bandIndex] = gainDb
            effectsMap.values.forEach { effect ->
                try {
                    val leftBand = effect.getPreEqBandByChannelIndex(0, bandIndex)
                    val rightBand = effect.getPreEqBandByChannelIndex(1, bandIndex)
                    leftBand.gain = gainDb
                    rightBand.gain = gainDb
                } catch (e: Exception) { 
                    e.printStackTrace() 
                }
            }
        }
    }

    fun getBandGains(): FloatArray = bandGains
    fun getActiveSessionCount(): Int = effectsMap.size

    private fun createNotification(): Notification {
        val channelId = "FatyliserChannel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Fatyliser Processing", NotificationManager.IMPORTANCE_LOW)
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("Fatyliser Engine Running")
            .setContentText("Processing system media...")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        serviceScope.cancel()
        effectsMap.values.forEach { 
            try {
                it.enabled = false
                it.release()
            } catch (e: Exception) { e.printStackTrace() }
        }
        effectsMap.clear()
        super.onDestroy()
    }
}
