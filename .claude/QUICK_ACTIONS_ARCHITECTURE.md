# Quick Actions System - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Dashboard Screen                         │
│                     (app/(tabs)/index.tsx)                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ activeTab: DashboardTab
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              <DashboardQuickActions />                           │
│         (components/dashboard/quick-actions.tsx)                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ dashboardId
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│           useDashboardQuickActions(dashboardId)                  │
│         (hooks/use-dashboard-quick-actions.ts)                   │
│                                                                   │
│   Delegates to dashboard-specific hooks based on dashboardId     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        │             │             │             │
        ▼             ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Overview    │ │Logistics │ │Warehouse │ │ Domestic │
│    Hook      │ │   Hook   │ │   Hook   │ │   Hook   │
└──────────────┘ └──────────┘ └──────────┘ └──────────┘
        │             │             │             │
        │             │             │             │
        └─────────────┼─────────────┼─────────────┘
                      │             │
        ┌─────────────┼─────────────┼─────────────┐
        │             │             │             │
        ▼             ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   Finance    │ │   CRM    │ │  Fleet   │ │  Stock   │
│     Hook     │ │   Hook   │ │   Hook   │ │   Hook   │
└──────────────┘ └──────────┘ └──────────┘ └──────────┘
        │             │             │             │
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
                      │
                      ▼
                ┌──────────┐
                │    HR    │
                │   Hook   │
                └──────────┘
                      │
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│ QuickAction[]    │       │  useHaptics()    │
│  (with icons,    │       │  (feedback on    │
│   labels,        │       │   press)         │
│   handlers)      │       │                  │
└────────┬─────────┘       └──────────────────┘
         │
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Quick Actions Grid                          │
│         (components/dashboard/quick-actions.tsx)                 │
│                                                                   │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│   │  Action  │  │  Action  │  │  Action  │  │  Action  │       │
│   │  Button  │  │  Button  │  │  Button  │  │  Button  │       │
│   │   [1]    │  │   [2]    │  │   [3]    │  │   [4]    │       │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                   │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│   │  Action  │  │  Action  │  │  Action  │  │  Action  │       │
│   │  Button  │  │  Button  │  │  Button  │  │  Button  │       │
│   │   [5]    │  │   [6]    │  │   [7]    │  │   [8]    │       │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                      │
                      │ onPress
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   User Action Handler                            │
│                                                                   │
│   1. hapticLight() - Haptic feedback                            │
│   2. router.push('/screen') - Navigate to screen                │
│   3. API call (if needed)                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Dashboard Tab Selection
```
User selects "Logistics" tab
    ↓
activeTab state updates to 'logistics'
    ↓
<DashboardQuickActions dashboardId={activeTab} />
```

### 2. Quick Actions Fetching
```
useDashboardQuickActions('logistics')
    ↓
Returns useLogisticsQuickActions()
    ↓
Returns QuickAction[] = [
  { id: 'new-trip', label: 'Yeni Sefer Oluştur', ... },
  { id: 'new-load', label: 'Yeni Yük Ekle', ... },
  { id: 'new-position', label: 'Pozisyon Oluştur', ... },
  { id: 'assign-driver', label: 'Sürücü Ata', ... },
]
```

### 3. Quick Actions Rendering
```
DashboardQuickActions receives actions[]
    ↓
Maps over actions
    ↓
Renders <QuickActionButton key={action.id} {...action} />
```

### 4. User Interaction
```
User taps "Yeni Sefer Oluştur" button
    ↓
QuickActionButton.onPress()
    ↓
1. Haptic feedback (hapticLight)
2. Navigation (router.push('/trips/new'))
```

## Component Hierarchy

```
app/(tabs)/index.tsx
└── DashboardQuickActions
    └── QuickActionButton (x4-6 per dashboard)
        ├── Pressable
        │   └── View (iconContainer)
        │       ├── Icon (Lucide)
        │       └── Badge (optional)
        └── Text (label)
```

## Hook Dependency Graph

```
useDashboardQuickActions
├── useOverviewQuickActions
│   └── useHaptics
├── useLogisticsQuickActions
│   └── useHaptics
├── useWarehouseQuickActions
│   └── useHaptics
├── useDomesticQuickActions
│   └── useHaptics
├── useFinanceQuickActions
│   └── useHaptics
├── useCrmQuickActions
│   └── useHaptics
├── useFleetQuickActions
│   └── useHaptics
├── useStockQuickActions
│   └── useHaptics
└── useHrQuickActions
    └── useHaptics
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                   QuickActionsContext                            │
│                (contexts/quick-actions-context.tsx)              │
│                                                                   │
│   State:                                                         │
│   - actions: QuickAction[]                                      │
│                                                                   │
│   Methods:                                                       │
│   - setActions(actions: QuickAction[])                          │
│                                                                   │
│   Provider:                                                      │
│   <QuickActionsProvider>                                        │
│     {children}                                                   │
│   </QuickActionsProvider>                                       │
│                                                                   │
│   Hook:                                                          │
│   useQuickActions() → { actions, setActions }                   │
└─────────────────────────────────────────────────────────────────┘
```

**Note**: Context is currently not actively used but provides foundation for future features like:
- Global badge count management
- Dynamic action updates
- User customization persistence

## Navigation Flow

```
Dashboard
    │
    ├── Overview Actions
    │   ├── Yeni Sefer → /trips/new
    │   ├── Yeni Yük → /loads/new
    │   ├── Yeni Teklif → /quote/new
    │   ├── AI Rapor → /ai-reports
    │   └── Yeni Mesaj → /messages
    │
    ├── Logistics Actions
    │   ├── Yeni Sefer → /trips/new
    │   ├── Yeni Yük → /(tabs)/loads
    │   ├── Pozisyon → /(tabs)/positions
    │   └── Sürücü Ata → /trips
    │
    ├── Warehouse Actions
    │   ├── Depo Kabul → /(tabs)/positions
    │   ├── Ön Taşıma → /(tabs)/positions
    │   ├── Yeni Depo → /warehouse/new
    │   └── Hazır Sevkiyat → /(tabs)/positions [DISABLED]
    │
    ├── Domestic Actions
    │   ├── Yeni Toplama → /domestic/new?type=collection
    │   ├── Yeni Teslimat → /domestic/new?type=delivery
    │   ├── Yeni Ön Taşıma → /domestic/new?type=pre_carriage
    │   ├── Pozisyon → /(tabs)/positions
    │   └── Durum Güncelle → /domestic
    │
    ├── Finance Actions
    │   ├── Tahsilat → /(tabs)/transactions
    │   ├── Ödeme → /(tabs)/transactions
    │   ├── Çek → /checks/new
    │   ├── Senet → /promissory-notes/new
    │   ├── Transfer → /(tabs)/transactions
    │   └── Fatura → /invoices/new
    │
    ├── CRM Actions
    │   ├── Yeni Teklif → /quote/new
    │   ├── Teklif Kopyala → /quotes
    │   ├── Müşteri → /contact/new?type=customer
    │   ├── Etkileşim → /crm/interactions/new
    │   ├── Teklifi Gönder → /quotes
    │   └── Dönüştür → /quotes
    │
    ├── Fleet Actions
    │   ├── Yeni Araç → /vehicle/new
    │   ├── Bakım → /(tabs)/vehicles
    │   ├── Arıza → /(tabs)/vehicles
    │   ├── Sigorta → /(tabs)/vehicles
    │   ├── Muayene → /(tabs)/vehicles
    │   └── Personel → /employee/new
    │
    ├── Stock Actions
    │   ├── Yeni Ürün → /products
    │   ├── Stok Giriş → /stock/new?type=stock_in
    │   ├── Stok Çıkış → /stock/new?type=stock_out
    │   ├── Kategori → /products
    │   ├── Marka → /products
    │   └── Transfer → /stock/transfer
    │
    └── HR Actions
        ├── Yeni Personel → /employee/new
        ├── Belge → /employees/certificates/new
        ├── Aile Üyesi → /employees/family-members/new
        ├── İş İlanı → /job-postings/new [DISABLED]
        ├── Başvuru → /job-applications [DISABLED]
        └── Mülakat → /job-applications/interviews [DISABLED]
```

## Backend Integration

```
Mobile App Quick Actions
        ↓
expo-router navigation
        ↓
Screen components
        ↓
API services
        ↓
axios HTTP client
        ↓
Laravel Sanctum auth
        ↓
Backend API endpoints
        ↓
┌────────────────────────────────────────┐
│  Mobile API Controllers                │
│  - DomesticTransportOrderController   │
│  - StockMovementController            │
│  - InvoiceController                  │
│  - VehicleController                  │
│  - QuoteController                    │
│  - ContactController                  │
│  - TransactionController              │
└────────────────────────────────────────┘
```

## Performance Optimization

```
Component Mount
    ↓
useDashboardQuickActions(dashboardId)
    ↓
useMemo(() => [...actions], [hapticLight])
    ↓
Actions cached until hapticLight reference changes
    ↓
No re-computation on parent re-renders
    ↓
Fast rendering & interaction
```

## Error Handling

```
User taps action
    ↓
Try {
    hapticLight() → Platform check → Execute or skip
    router.push() → Route exists? → Navigate or error
}
Catch {
    Log error
    Show toast notification (if available)
    Graceful fallback
}
```

## Future Enhancements Flow

```
User preferences stored in backend
    ↓
Fetch on app start
    ↓
setActions([...customActions, ...defaultActions])
    ↓
QuickActionsContext provides to all components
    ↓
User can reorder, add, remove actions
    ↓
Changes persist to backend
    ↓
Sync across devices
```

This architecture provides a scalable, maintainable, and performant quick actions system ready for production use! 🚀
