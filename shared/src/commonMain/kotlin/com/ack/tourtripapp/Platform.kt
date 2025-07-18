package com.ack.tourtripapp

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform