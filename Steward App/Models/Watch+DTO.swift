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
            imageURL: dto.imageURL,
            lastCheckedAt: dto.lastChecked
        )
        // Preserve the UUID and timestamp from Supabase
        self.id = dto.id
        self.createdAt = dto.createdAt
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
            lastChecked: nil,
            triggered: self.triggered,
            changeNote: self.changeNote,
            imageURL: self.imageURL,
            createdAt: self.createdAt
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
            time: dto.createdAt.formatted(.relative(presentation: .named))
        )
        self.id = dto.id
        self.createdAt = dto.createdAt
    }

    /// Convert to DTO for uploading to Supabase
    func toDTO(userId: UUID, watchId: UUID? = nil) -> ActivityDTO {
        ActivityDTO(
            id: self.id,
            userId: userId,
            watchId: watchId,
            icon: self.icon,
            iconColorName: self.iconColorName,
            label: self.label,
            subtitle: self.subtitle,
            createdAt: self.createdAt
        )
    }
}
