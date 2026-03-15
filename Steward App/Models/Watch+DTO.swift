import Foundation

// MARK: - Conversion between SwiftData Watch and Supabase WatchDTO

extension Watch {
    /// Create a SwiftData Watch from a Supabase DTO
    convenience init(from dto: WatchDTO) {
        self.init(
            emoji: dto.emoji,
            name: dto.name,
            url: dto.url,
            condition: dto.condition,
            actionLabel: dto.actionLabel,
            actionType: ActionType(rawValue: dto.actionType) ?? .notify,
            status: WatchStatus(rawValue: dto.status) ?? .watching,
            lastSeen: dto.lastChecked?.formatted(.relative(presentation: .named)) ?? "Not yet",
            triggered: dto.triggered,
            changeNote: dto.changeNote,
            checkFrequency: dto.checkFrequency,
            preferredCheckTime: dto.preferredCheckTime,
            notifyChannels: dto.notifyChannels ?? "push",
            imageURL: dto.imageURL,
            actionURL: dto.actionURL,
            lastCheckedAt: dto.lastChecked,
            watchMode: dto.watchMode,
            searchQuery: dto.searchQuery,
            consecutiveFailures: dto.consecutiveFailures,
            lastError: dto.lastError,
            needsAttention: dto.needsAttention
        )
        // Preserve the UUID and timestamp from Supabase
        self.id = dto.id
        self.createdAt = dto.createdAt
        self.couponCode = dto.couponCode
        self.autoActEnabled = dto.autoAct
        self.spendingLimit = dto.spendingLimit
    }

    /// Convert to DTO for uploading to Supabase
    func toDTO(userId: UUID) -> WatchDTO {
        WatchDTO(
            id: self.id,
            userId: userId,
            emoji: self.emoji,
            name: self.name,
            url: self.url,
            condition: self.condition,
            actionLabel: self.actionLabel,
            actionType: self.actionTypeRaw,
            status: self.statusRaw,
            checkFrequency: self.checkFrequency,
            preferredCheckTime: self.preferredCheckTime,
            notifyChannels: self.notifyChannels,
            lastChecked: self.lastCheckedAt,
            triggered: self.triggered,
            changeNote: self.changeNote,
            imageURL: self.imageURL,
            actionURL: self.actionURL,
            createdAt: self.createdAt,
            watchMode: self.watchMode,
            searchQuery: self.searchQuery,
            consecutiveFailures: self.consecutiveFailures,
            lastError: self.lastError,
            needsAttention: self.needsAttention,
            couponCode: self.couponCode,
            autoAct: self.autoActEnabled,
            spendingLimit: self.spendingLimit
        )
    }
}

// MARK: - Conversion between SwiftData ActivityItem and Supabase ActivityDTO

extension ActivityItem {
    /// Create a SwiftData ActivityItem from a Supabase DTO
    convenience init(from dto: ActivityDTO) {
        self.init(
            icon: dto.icon,
            iconColorName: dto.iconColorName,
            label: dto.label,
            subtitle: dto.subtitle,
            time: dto.createdAt.formatted(.relative(presentation: .named)),
            watchId: dto.watchId
        )
        self.id = dto.id
        self.createdAt = dto.createdAt
    }

    /// Convert to DTO for uploading to Supabase
    func toDTO(userId: UUID, watchId: UUID? = nil) -> ActivityDTO {
        ActivityDTO(
            id: self.id,
            userId: userId,
            watchId: watchId ?? self.watchId,
            icon: self.icon,
            iconColorName: self.iconColorName,
            label: self.label,
            subtitle: self.subtitle,
            createdAt: self.createdAt
        )
    }
}
