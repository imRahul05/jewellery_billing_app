package com.example.data

import com.example.data.room.*
import com.example.data.repository.ErpRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object DemoDataGenerator {
    suspend fun generate(repository: ErpRepository) = withContext(Dispatchers.IO) {
        // Categories
        val categories = listOf("Gold Rings", "Silver Chains", "Diamond Necklaces", "Gold Coins")
        val names = listOf("Rahul", "Aarav", "Neha", "Priya", "Vikram", "Anjali", "Suresh", "Ramesh", "Kiran")
        
        // Config
        repository.saveStoreConfig(StoreConfig(1, "Shree Laxmi Jewellers", "Rahul Kumar", "27AAAAA0000A1Z5", "9876543210", true))
        
        // Products
        val products = mutableListOf<Product>()
        for (i in 1..100) {
            val product = Product(
                name = "${categories.random()} Model $i",
                category = categories.random(),
                purity = if (i % 2 == 0) "22K" else "18K",
                weight = (5..50).random().toDouble(),
                stock = (2..20).random(),
                price = (5000..50000).random().toDouble()
            )
            repository.insertProduct(product)
            products.add(product)
        }
        
        // Customers
        val customers = mutableListOf<Customer>()
        for (i in 1..50) {
            val customer = Customer(
                name = "${names.random()} Customer $i",
                mobile = "98${(10000000..99999999).random()}",
                outstanding = if (i % 5 == 0) (1000..5000).random().toDouble() else 0.0,
                totalPurchase = (10000..100000).random().toDouble()
            )
            repository.insertCustomer(customer)
            customers.add(customer)
        }
        
        // Expenses
        val expenses = listOf("Rent", "Electricity", "Salary", "Tea/Coffee")
        for (i in 1..20) {
            val expense = Expense(
                category = expenses.random(),
                amount = (100..5000).random().toDouble(),
                notes = "Monthly expense",
                date = System.currentTimeMillis() - (i * 86400000L) // past days
            )
            repository.insertExpense(expense)
        }
    }
}
