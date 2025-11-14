import SwiftUI
import shared

/**
 * Login View (Phase 2 - Authentication)
 */
struct LoginView: View {
    @StateObject private var viewModel = AuthViewModel()
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var passwordVisible: Bool = false

    var onLoginSuccess: () -> Void

    var body: some View {
        NavigationView {
            ZStack {
                VStack(spacing: 20) {
                    // Logo/Title
                    Text("TourTipApp")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                        .padding(.bottom, 40)

                    // Email field
                    TextField("E-posta", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)

                    // Password field
                    HStack {
                        if passwordVisible {
                            TextField("Şifre", text: $password)
                                .textFieldStyle(.roundedBorder)
                        } else {
                            SecureField("Şifre", text: $password)
                                .textFieldStyle(.roundedBorder)
                        }

                        Button(action: {
                            passwordVisible.toggle()
                        }) {
                            Image(systemName: passwordVisible ? "eye.slash" : "eye")
                                .foregroundColor(.gray)
                        }
                    }

                    // Error message
                    if case .error(let message) = viewModel.state {
                        Text(message)
                            .foregroundColor(.red)
                            .font(.caption)
                            .multilineTextAlignment(.center)
                    }

                    // Login button
                    Button(action: {
                        viewModel.signIn(email: email, password: password)
                    }) {
                        if case .loading = viewModel.state {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Giriş Yap")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isFormValid ? Color.blue : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .disabled(!isFormValid || viewModel.state == .loading)

                    // Sign up link
                    NavigationLink(destination: SignUpView(onSignUpSuccess: onLoginSuccess)) {
                        Text("Hesabınız yok mu? Kayıt olun")
                            .font(.subheadline)
                            .foregroundColor(.blue)
                    }
                }
                .padding()
            }
            .navigationTitle("Giriş Yap")
            .onChange(of: viewModel.state) { newState in
                if case .success = newState {
                    onLoginSuccess()
                }
            }
        }
    }

    private var isFormValid: Bool {
        !email.isEmpty && !password.isEmpty
    }
}

/**
 * Sign Up View Placeholder
 */
struct SignUpView: View {
    @StateObject private var viewModel = AuthViewModel()
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var displayName: String = ""

    var onSignUpSuccess: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Text("Kayıt Ol")
                .font(.largeTitle)
                .fontWeight(.bold)

            TextField("Ad Soyad", text: $displayName)
                .textFieldStyle(.roundedBorder)

            TextField("E-posta", text: $email)
                .textFieldStyle(.roundedBorder)
                .textContentType(.emailAddress)
                .autocapitalization(.none)
                .keyboardType(.emailAddress)

            SecureField("Şifre", text: $password)
                .textFieldStyle(.roundedBorder)

            Button(action: {
                viewModel.signUp(email: email, password: password, displayName: displayName)
            }) {
                if case .loading = viewModel.state {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Text("Kayıt Ol")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(!email.isEmpty && !password.isEmpty && !displayName.isEmpty ? Color.blue : Color.gray)
            .foregroundColor(.white)
            .cornerRadius(10)
            .disabled(email.isEmpty || password.isEmpty || displayName.isEmpty)
        }
        .padding()
        .onChange(of: viewModel.state) { newState in
            if case .success = newState {
                onSignUpSuccess()
            }
        }
    }
}
