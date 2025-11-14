package com.tourtrip.android.ui.tours

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tourtrip.shared.data.remote.ApiClient
import com.tourtrip.shared.data.repository.TourRepository
import com.tourtrip.shared.domain.models.Tour
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for Tours Screen
 */
class ToursViewModel : ViewModel() {

    private val apiClient = ApiClient()
    private val tourRepository = TourRepository(apiClient)

    private val _uiState = MutableStateFlow<ToursUiState>(ToursUiState.Loading)
    val uiState: StateFlow<ToursUiState> = _uiState.asStateFlow()

    init {
        loadTours()
    }

    fun loadTours() {
        viewModelScope.launch {
            _uiState.value = ToursUiState.Loading

            tourRepository.getTours().fold(
                onSuccess = { tours ->
                    _uiState.value = ToursUiState.Success(tours)
                },
                onFailure = { error ->
                    _uiState.value = ToursUiState.Error(error.message ?: "Unknown error")
                }
            )
        }
    }

    fun searchTours(query: String) {
        viewModelScope.launch {
            _uiState.value = ToursUiState.Loading

            tourRepository.searchTours(query).fold(
                onSuccess = { tours ->
                    _uiState.value = ToursUiState.Success(tours)
                },
                onFailure = { error ->
                    _uiState.value = ToursUiState.Error(error.message ?: "Search failed")
                }
            )
        }
    }

    override fun onCleared() {
        super.onCleared()
        apiClient.close()
    }
}

/**
 * UI State for Tours Screen
 */
sealed class ToursUiState {
    object Loading : ToursUiState()
    data class Success(val tours: List<Tour>) : ToursUiState()
    data class Error(val message: String) : ToursUiState()
}
