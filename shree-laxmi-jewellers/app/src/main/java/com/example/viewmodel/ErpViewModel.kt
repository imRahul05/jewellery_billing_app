package com.example.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.repository.ErpRepository
import com.example.data.room.*
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class ErpViewModel(private val repository: ErpRepository) : ViewModel() {
    val storeConfig: StateFlow<StoreConfig?> = repository.storeConfig.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )
    
    val allCustomers: StateFlow<List<Customer>> = repository.allCustomers.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )
    
    val allProducts: StateFlow<List<Product>> = repository.allProducts.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )
    
    val allBills: StateFlow<List<Bill>> = repository.allBills.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )
    
    val allExpenses: StateFlow<List<Expense>> = repository.allExpenses.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )
    
    val todaySales: StateFlow<Double?> = repository.getTodaySales().stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0
    )
    
    val todayBillsCount: StateFlow<Int?> = repository.getTodayBillsCount().stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), 0
    )
    
    val totalExpenses: StateFlow<Double?> = repository.totalExpenses.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0
    )

    fun saveStoreConfig(config: StoreConfig) {
        viewModelScope.launch { repository.saveStoreConfig(config) }
    }
    
    fun insertCustomer(customer: Customer) {
        viewModelScope.launch { repository.insertCustomer(customer) }
    }
    
    fun insertProduct(product: Product) {
        viewModelScope.launch { repository.insertProduct(product) }
    }
    
    fun insertExpense(expense: Expense) {
        viewModelScope.launch { repository.insertExpense(expense) }
    }
    
    fun createBill(bill: Bill, items: List<BillItem>, products: List<Product>, customer: Customer?) {
        viewModelScope.launch { 
            repository.createBill(bill, items, products, customer) 
        }
    }
}

class ErpViewModelFactory(private val repository: ErpRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ErpViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return ErpViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
