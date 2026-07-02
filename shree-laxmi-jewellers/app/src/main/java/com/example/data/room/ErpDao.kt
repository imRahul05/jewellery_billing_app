package com.example.data.room

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface ErpDao {
    // Config
    @Query("SELECT * FROM store_config WHERE id = 1")
    fun getStoreConfig(): Flow<StoreConfig?>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveStoreConfig(config: StoreConfig)

    // Customers
    @Query("SELECT * FROM customers ORDER BY createdAt DESC")
    fun getAllCustomers(): Flow<List<Customer>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomer(customer: Customer)
    
    @Update
    suspend fun updateCustomer(customer: Customer)

    // Products
    @Query("SELECT * FROM products ORDER BY createdAt DESC")
    fun getAllProducts(): Flow<List<Product>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduct(product: Product)
    
    @Update
    suspend fun updateProduct(product: Product)

    // Bills
    @Query("SELECT * FROM bills ORDER BY date DESC")
    fun getAllBills(): Flow<List<Bill>>
    
    @Query("SELECT SUM(totalAmount) FROM bills WHERE date >= :startOfDay")
    fun getTodaySales(startOfDay: Long): Flow<Double?>
    
    @Query("SELECT COUNT(*) FROM bills WHERE date >= :startOfDay")
    fun getTodayBillsCount(startOfDay: Long): Flow<Int?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBill(bill: Bill): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBillItems(items: List<BillItem>)

    @Query("SELECT * FROM bill_items WHERE billId = :billId")
    fun getBillItems(billId: Int): Flow<List<BillItem>>

    // Expenses
    @Query("SELECT * FROM expenses ORDER BY date DESC")
    fun getAllExpenses(): Flow<List<Expense>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: Expense)
    
    @Query("SELECT SUM(amount) FROM expenses")
    fun getTotalExpenses(): Flow<Double?>
}
