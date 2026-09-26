package com.fatyliser.eq

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

/**
 * MainActivity: 100% Native Jetpack Compose Interface for Fatyliser 32-Band Equalizer.
 * Connects directly to AudioEngineService to manipulate DSP band gains in real time.
 */
class MainActivity : ComponentActivity() {

    private var audioEngineService: AudioEngineService? = null
    private var isBound by mutableStateOf(false)
    private var activeSessions by mutableIntStateOf(0)

    // Observable array of 32 band gains (-12.0f to +12.0f dB)
    private val bandGains = mutableStateListOf<Float>().apply {
        repeat(32) { add(0.0f) }
    }

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, binder: IBinder?) {
            val localBinder = binder as? AudioEngineService.AudioEngineBinder
            audioEngineService = localBinder?.getService()
            isBound = true

            // Sync current gains from service
            audioEngineService?.let { service ->
                val current = service.getBandGains()
                for (i in 0 until 32) {
                    bandGains[i] = current[i]
                }
                activeSessions = service.getActiveSessionCount()
            }
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            audioEngineService = null
            isBound = false
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Start and bind to the AudioEngineService
        val serviceIntent = Intent(this, AudioEngineService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
        bindService(serviceIntent, serviceConnection, Context.BIND_AUTO_CREATE)

        setContent {
            // Periodic polling of active sessions count
            LaunchedEffect(isBound) {
                while (isBound) {
                    audioEngineService?.let {
                        activeSessions = it.getActiveSessionCount()
                    }
                    delay(2000)
                }
            }

            FatyliserEqualizerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF070B14)
                ) {
                    EqualizerScreen(
                        isBound = isBound,
                        activeSessions = activeSessions,
                        bandGains = bandGains,
                        onGainChange = { index, newGain ->
                            bandGains[index] = newGain
                            audioEngineService?.updateBandGain(index, newGain)
                        },
                        onApplyPreset = { presetGains ->
                            for (i in 0 until 32) {
                                bandGains[i] = presetGains[i]
                            }
                            audioEngineService?.updateAllBands(presetGains)
                        }
                    )
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (isBound) {
            unbindService(serviceConnection)
            isBound = false
        }
    }
}

/**
 * Main Jetpack Compose Equalizer Screen layout with 32 vertical sliders in LazyRow.
 */
@Composable
fun EqualizerScreen(
    isBound: Boolean,
    activeSessions: Int,
    bandGains: List<Float>,
    onGainChange: (index: Int, gain: Float) -> Unit,
    onApplyPreset: (FloatArray) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(vertical = 12.dp)
    ) {
        // --- Header Section ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "FATYLISER",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 2.sp,
                    color = Color(0xFF00E5FF),
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "SYSTEM-WIDE 32-BAND EQUALIZER",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF94A3B8),
                    letterSpacing = 1.sp
                )
            }

            // Status Badge
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = if (isBound) Color(0xFF052E2B) else Color(0xFF2E0505),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (isBound) Color(0xFF00F59B) else Color(0xFFFF5252)
                )
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(
                                color = if (isBound) Color(0xFF00F59B) else Color(0xFFFF5252),
                                shape = CircleShape
                            )
                    )
                    Text(
                        text = if (isBound) "DSP ACTIVE ($activeSessions)" else "DISCONNECTED",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isBound) Color(0xFF00F59B) else Color(0xFFFF5252),
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // --- Quick Preset Selector Chips ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            PresetButton(title = "FLAT", onClick = {
                onApplyPreset(FloatArray(32) { 0.0f })
            })
            PresetButton(title = "BASS BOOST", onClick = {
                val bass = FloatArray(32) { i ->
                    when {
                        i < 6 -> 8.0f - (i * 0.8f)
                        i < 12 -> 3.0f - ((i - 6) * 0.5f)
                        else -> 0.0f
                    }
                }
                onApplyPreset(bass)
            })
            PresetButton(title = "HARMAN", onClick = {
                val harman = floatArrayOf(
                    5.5f, 5.8f, 5.6f, 5.2f, 4.5f, 3.5f, 2.5f, 1.5f,
                    0.8f, 0.2f, -0.1f, -0.1f, 0.0f, 0.0f, 0.0f, 0.0f,
                    0.5f, 1.0f, 2.0f, 3.2f, 6.5f, 8.5f, 9.0f, 7.8f,
                    5.5f, 3.0f, 1.5f, -0.5f, -2.0f, -4.5f, -6.0f, -7.0f
                )
                onApplyPreset(harman)
            })
            PresetButton(title = "VOCAL", onClick = {
                val vocal = FloatArray(32) { i ->
                    when (i) {
                        in 12..22 -> 3.5f
                        in 0..5 -> -2.0f
                        else -> 0.0f
                    }
                }
                onApplyPreset(vocal)
            })
        }

        Spacer(modifier = Modifier.height(12.dp))

        // --- 32-Band Horizontal Scrollable LazyRow with Vertical Sliders ---
        Card(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 12.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0D1322)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B))
        ) {
            LazyRow(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 8.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                itemsIndexed(bandGains) { index, gain ->
                    val frequency = AudioEngineService.FREQUENCIES[index]
                    val freqLabel = if (frequency >= 1000f) {
                        val k = frequency / 1000f
                        if (k % 1f == 0f) "${k.toInt()}k" else "${k}k"
                    } else {
                        if (frequency % 1f == 0f) "${frequency.toInt()}" else "$frequency"
                    }

                    VerticalBandSlider(
                        index = index + 1,
                        freqLabel = freqLabel,
                        gainDb = gain,
                        onGainChanged = { newGain ->
                            onGainChange(index, newGain)
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Footer info bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Hardware DynamicsProcessing (Pre-EQ + Limiter)",
                fontSize = 10.sp,
                color = Color(0xFF64748B),
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = "32 BANDS (20Hz - 20kHz)",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF00E5FF),
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

/**
 * Custom Vertical Slider Composable:
 * Provides touch-friendly vertical dragging (-12 dB to +12 dB) with glowing cyan track
 * and precision numeric readout.
 */
@Composable
fun VerticalBandSlider(
    index: Int,
    freqLabel: String,
    gainDb: Float,
    onGainChanged: (Float) -> Unit
) {
    Column(
        modifier = Modifier
            .width(52.dp)
            .fillMaxHeight(),
        horizontalAlignment = Alignment.CenterVertically,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Gain readout (e.g. +3.5 or -2.0)
        Text(
            text = if (gainDb > 0) "+${String.format("%.1f", gainDb)}" else "${String.format("%.1f", gainDb)}",
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = if (gainDb > 0) Color(0xFF00F59B) else if (gainDb < 0) Color(0xFF38BDF8) else Color(0xFF94A3B8),
            fontFamily = FontFamily.Monospace,
            textAlign = TextAlign.Center
        )

        // Vertical Slider Track with Draggable Thumb
        BoxWithConstraints(
            modifier = Modifier
                .weight(1f)
                .width(42.dp)
                .padding(vertical = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            val trackHeight = maxHeight

            // Vertical touch gesture drag handler
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectVerticalDragGestures { change, dragAmount ->
                            change.consume()
                            // Invert drag: dragging UP increases gain, dragging DOWN decreases gain
                            val deltaDb = -(dragAmount / 15f)
                            val newGain = (gainDb + deltaDb).coerceIn(-12.0f, 12.0f)
                            onGainChanged(Math.round(newGain * 10f) / 10f)
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                // Background Track
                Box(
                    modifier = Modifier
                        .width(6.dp)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(3.dp))
                        .background(Color(0xFF1E293B))
                )

                // Center 0 dB guide line
                Box(
                    modifier = Modifier
                        .width(22.dp)
                        .height(1.dp)
                        .background(Color(0xFF475569))
                )

                // Position calculation: normalized gain 0.0 (bottom, -12dB) to 1.0 (top, +12dB)
                val normalizedGain = ((gainDb - (-12f)) / (12f - (-12f))).coerceIn(0f, 1f)

                // Filled Active Bar from 0 dB baseline to current thumb
                val centerOffset = 0.5f
                val fillTop = if (normalizedGain >= centerOffset) 1f - normalizedGain else 0.5f
                val fillBottom = if (normalizedGain < centerOffset) 1f - normalizedGain else 0.5f
                val fillHeight = kotlin.math.abs(normalizedGain - centerOffset)

                Box(
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = trackHeight * fillTop)
                        .width(6.dp)
                        .height(trackHeight * fillHeight)
                        .background(
                            brush = Brush.verticalGradient(
                                colors = listOf(Color(0xFF00E5FF), Color(0xFF00F59B))
                            )
                        )
                )

                // Thumb Knob
                val thumbTopPadding = trackHeight * (1f - normalizedGain) - 10.dp
                Box(
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = thumbTopPadding.coerceAtLeast(0.dp))
                        .size(width = 30.dp, height = 20.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFF00E5FF))
                        .border(1.dp, Color(0xFFFFFFFF), RoundedCornerShape(6.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .width(12.dp)
                            .height(2.dp)
                            .background(Color(0xFF070B14))
                    )
                }
            }
        }

        // Frequency Label (Bottom)
        Column(
            horizontalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = freqLabel,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFE2E8F0),
                fontFamily = FontFamily.Monospace,
                textAlign = TextAlign.Center
            )
            Text(
                text = "B$index",
                fontSize = 8.sp,
                color = Color(0xFF64748B),
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

/**
 * Quick Preset Chip Button
 */
@Composable
fun PresetButton(title: String, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
        shape = RoundedCornerShape(10.dp),
        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
        modifier = Modifier.height(30.dp)
    ) {
        Text(
            text = title,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF00E5FF),
            letterSpacing = 0.5.sp
        )
    }
}

/**
 * Native Material3 Dark Audiophile Theme
 */
@Composable
fun FatyliserEqualizerTheme(content: @Composable () -> Unit) {
    val darkColorScheme = darkColorScheme(
        primary = Color(0xFF00E5FF),
        secondary = Color(0xFF00F59B),
        background = Color(0xFF070B14),
        surface = Color(0xFF0D1322),
        onPrimary = Color(0xFF000000),
        onBackground = Color(0xFFE2E8F0),
        onSurface = Color(0xFFE2E8F0)
    )

    MaterialTheme(
        colorScheme = darkColorScheme,
        content = content
    )
}
