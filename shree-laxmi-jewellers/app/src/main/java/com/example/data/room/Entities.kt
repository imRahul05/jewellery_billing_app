package com.example.data.room

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "customers")
data class Customer(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val mobile: String,
    val outstanding: Double = 0.0,
    val totalPurchase: Double = 0.0,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "products")
data class Product(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val category: String,
    val purity: String,
    val weight: Double,
    val stock: Int,
    val price: Double,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "bills")
data class Bill(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val customerName: String,
    val customerMobile: String,
    val totalAmount: Double,
    val paymentMethod: String,
    val date: Long = System.currentTimeMillis()
)

@Entity(tableName = "bill_items")
data class BillItem(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val billId: Int,
    val productName: String,
    val quantity: Int,
    val price: Double
)

@Entity(tableName = "expenses")
data class Expense(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val category: String,
    val amount: Double,
    val date: Long = System.currentTimeMillis(),
    val notes: String
)

@Entity(tableName = "store_config")
data class StoreConfig(
    @PrimaryKey val id: Int = 1,
    val businessName: String,
    val ownerName: String,
    val gstNumber: String,
    val phone: String,
    val isSetupComplete: Boolean = false,
    val goldRate: Double = 5842.0,
    val silverRate: Double = 74.5
)
