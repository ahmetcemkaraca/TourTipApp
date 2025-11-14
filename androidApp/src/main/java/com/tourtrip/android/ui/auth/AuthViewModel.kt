package com.tourtrip.android.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tourtrip.shared.data.remote.ApiClient
import com.tourtrip.shared.data.repository.AuthRepository
import com.tourtrip.shared.domain.models.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Auth ViewModel (Phase 2)
 */
class AuthViewModel : ViewModel() {

    private val apiClient = ApiClient()
    private val authRepository = AuthRepository(apiClient)

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    fun signIn(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading

            authRepository.signIn(email, password).fold(
                onSuccess = { user ->
                    _currentUser.value = user
                    _uiState.value = AuthUiState.Success(user)
                },
                onFailure = { error ->
                    _uiState.value = AuthUiState.Error(error.message ?: "Giriş başarısız")
                }
            )
        }
    }

    fun signUp(email: String, password: String, displayName: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading

            authRepository.signUp(email, password, displayName).fold(
                onSuccess = { user ->
                    _currentUser.value = user
                    _uiState.value = AuthUiState.Success(user)
                },
                onFailure = { error ->
                    _uiState.value = AuthUiState.Error(error.message ?: "Kayıt başarısız")
                }
            )
        }
    }

    fun signOut() {
        viewModelScope.launch {
            authRepository.signOut()
            _currentUser.value = null
            _uiState.value = AuthUiState.Idle
        }
    }

    fun resetPassword(email: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading

            authRepository.resetPassword(email).fold(
                onSuccess = {
                    _uiState.value = AuthUiState.PasswordResetSent
                },
                onFailure = { error ->
                    _uiState.value = AuthUiState.Error(error.message ?: "Şifre sıfırlama başarısız")
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
 * UI State for Authentication
 */
sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    data class Success(val user: User) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
    object PasswordResetSent : AuthUiState()
}
