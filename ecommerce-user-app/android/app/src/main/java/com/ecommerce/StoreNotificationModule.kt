package com.ecommerce

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class StoreNotificationModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  companion object {
    private const val CHANNEL_ID = "ecommerce_updates"
    private val DATA_KEYS = listOf("screen", "orderId", "chatId", "productId")
    private var pendingNotificationData: MutableMap<String, String>? = null

    @JvmStatic
    fun cacheNotificationIntent(intent: Intent?) {
      val extras = intent?.extras ?: return
      val data = DATA_KEYS
        .mapNotNull { key -> extras.getString(key)?.let { value -> key to value } }
        .toMap()
        .toMutableMap()

      if (data.isNotEmpty()) {
        pendingNotificationData = data
      }
    }
  }

  override fun getName() = "StoreNotification"

  init {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Order and store updates", NotificationManager.IMPORTANCE_HIGH),
      )
    }
  }

  @ReactMethod
  fun show(title: String, body: String, data: ReadableMap?) {
    val launchIntent = Intent(context, MainActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
      DATA_KEYS.forEach { key ->
        if (data?.hasKey(key) == true && !data.getString(key).isNullOrBlank()) {
          putExtra(key, data.getString(key))
        }
      }
    }
    val notificationId = System.currentTimeMillis().toInt()
    val pendingIntent = PendingIntent.getActivity(
      context,
      notificationId,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setAutoCancel(true)
      .setContentIntent(pendingIntent)
      .build()

    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.notify(notificationId, notification)
  }

  @ReactMethod
  fun getInitialNotification(promise: Promise) {
    val data = pendingNotificationData
    pendingNotificationData = null

    if (data == null) {
      promise.resolve(null)
      return
    }

    val map = Arguments.createMap()
    data.forEach { (key, value) -> map.putString(key, value) }
    promise.resolve(map)
  }
}
