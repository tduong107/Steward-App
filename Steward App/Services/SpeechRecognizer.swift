import Foundation
import Speech
import AVFoundation

/// Manages live speech-to-text using Apple's Speech framework.
/// Observable so SwiftUI views can react to state changes.
@Observable
final class SpeechRecognizer {
    var transcript = ""
    var isListening = false
    var isAuthorized = false
    var errorMessage: String?

    private var recognitionTask: SFSpeechRecognitionTask?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private let audioEngine = AVAudioEngine()
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))

    init() {
        checkAuthorization()
    }

    // MARK: - Authorization

    func checkAuthorization() {
        switch SFSpeechRecognizer.authorizationStatus() {
        case .authorized:
            isAuthorized = true
        case .notDetermined:
            requestAuthorization()
        default:
            isAuthorized = false
        }
    }

    func requestAuthorization() {
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            DispatchQueue.main.async {
                self?.isAuthorized = status == .authorized
            }
        }
    }

    // MARK: - Start / Stop

    func startListening() {
        guard !isListening else { return }
        guard let speechRecognizer, speechRecognizer.isAvailable else {
            errorMessage = "Speech recognition unavailable"
            return
        }

        // Reset state
        stopListening()
        transcript = ""
        errorMessage = nil

        // Request mic permission if needed
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            errorMessage = "Microphone access failed"
            return
        }

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest else { return }

        recognitionRequest.shouldReportPartialResults = true
        // On-device recognition when available (faster, works offline)
        if #available(iOS 13, *) {
            recognitionRequest.requiresOnDeviceRecognition = speechRecognizer.supportsOnDeviceRecognition
        }

        recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self else { return }

            if let result {
                DispatchQueue.main.async {
                    self.transcript = result.bestTranscription.formattedString
                }

                // Auto-stop after final result
                if result.isFinal {
                    DispatchQueue.main.async {
                        self.stopListening()
                    }
                }
            }

            if let error {
                // Ignore cancellation errors (normal when stopping)
                let nsError = error as NSError
                if nsError.domain == "kAFAssistantErrorDomain" && nsError.code == 216 {
                    return // "Request was canceled" — expected
                }
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                    self.stopListening()
                }
            }
        }

        // Attach audio input
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            recognitionRequest.append(buffer)
        }

        do {
            audioEngine.prepare()
            try audioEngine.start()
            isListening = true
        } catch {
            errorMessage = "Audio engine failed to start"
        }
    }

    func stopListening() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil
        isListening = false

        // Deactivate audio session
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    func toggleListening() {
        if isListening {
            stopListening()
        } else {
            if !isAuthorized {
                requestAuthorization()
                return
            }
            startListening()
        }
    }
}
