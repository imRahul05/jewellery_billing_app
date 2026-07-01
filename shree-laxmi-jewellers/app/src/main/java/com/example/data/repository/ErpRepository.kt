package com.example.data.repository

import com.example.data.room.*
import kotlinx.coroutines.flow.Flow
import java.util.Calendar

class ErpRepository(private val dao: ErpDao) {
    val storeConfig = dao.getStoreConfig()
    val allCustomers = dao.getAllCustomers()
    val allProducts = dao.getAllProducts()
    val allBills = dao.getAllBills()
    val allExpenses = dao.getAllExpenses()
    
    val totalExpenses = dao.getTotalExpenses()
    
    fun getTodaySales(): Flow<Double?> {
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return dao.getTodaySales(cal.timeInMillis)
    }
    
    fun getTodayBillsCount(): Flow<Int?> {
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return dao.getTodayBillsCount(cal.timeInMillis)
    }

    suspend fun saveStoreConfig(config: StoreConfig) = dao.saveStoreConfig(config)
    suspend fun insertCustomer(customer: Customer) = dao.insertCustomer(customer)
    suspend fun updateCustomer(customer: Customer) = dao.updateCustomer(customer)
    suspend fun insertProduct(product: Product) = dao.insertProduct(product)
    suspend fun updateProduct(product: Product) = dao.updateProduct(product)
    suspend fun insertExpense(expense: Expense) = dao.insertExpense(expense)
    
    suspend fun createBill(bill: Bill, items: List<BillItem>, productsToUpdate: List<Product>, customerToUpdate: Customer?) {
        val billId = dao.insertBill(bill).toInt()
        val itemsWithId = items.map { it.copy(billId = billId) }
        dao.insertBillItems(itemsWithId)
        
        productsToUpdate.forEach { dao.updateProduct(it) }
        if (customerToUpdate != null) {
            dao.updateCustomer(customerToUpdate)
        }
    }
    
    fun getBillItems(billId: Int) = dao.getBillItems(billId)
}
