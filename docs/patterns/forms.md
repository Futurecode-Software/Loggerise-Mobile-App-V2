# Form Sayfa Pattern'leri

## PageHeader Kullanımı

> **STANDART:** Tüm form sayfalarında `PageHeader` component'i kullanılmalıdır.

```typescript
import { PageHeader } from '@/components/navigation'

export default function NewItemScreen() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <View style={styles.container}>
      <PageHeader
        title="Yeni Kayıt"
        subtitle="Bilgileri girin"
        icon="add-circle-outline"
        showBackButton
        onBackPress={() => router.back()}
        rightAction={{
          icon: 'checkmark',
          onPress: handleSubmit,
          isLoading: isSubmitting
        }}
        variant="compact"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form içeriği */}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  keyboardView: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  }
})
```

## PageHeader Props

| Prop | Tip | Açıklama |
|------|-----|----------|
| `title` | string | Başlık metni (zorunlu) |
| `subtitle` | string | Alt başlık metni |
| `icon` | Ionicons.glyphMap | Başlık ikonu |
| `showBackButton` | boolean | Geri butonu gösterimi |
| `onBackPress` | () => void | Geri butonu tıklama |
| `rightAction.icon` | Ionicons.glyphMap | Aksiyon ikonu |
| `rightAction.onPress` | () => void | Aksiyon tıklama |
| `rightAction.isLoading` | boolean | Loading durumu |
| `rightAction.disabled` | boolean | Devre dışı durumu |
| `variant` | 'default' \| 'compact' | Header boyutu |

**Variant seçimi:**
- `variant="compact"` → Form sayfaları (new, edit)
- `variant="default"` → Liste sayfaları

## Multi-Step Wizard Pattern

Karmaşık formlar için (4+ adım, 15+ alan):

```typescript
export default function FormScreen() {
  const [currentStep, setCurrentStep] = useState(0)
  const { state, actions } = useFormReducer()
  const { isSubmitting, submitForm } = useFormSubmit(editId)

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return <Step1BasicInfo state={state} ... />
      case 1: return <Step2Details state={state} ... />
      // ...
    }
  }

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        <PageHeader
          title="Form Başlığı"
          subtitle={`${TOTAL_STEPS} Adımlı Form`}
          showBackButton
          onBackPress={handleBack}
          rightAction={{
            icon: 'checkmark',
            onPress: handleSubmit,
            isLoading: isSubmitting
          }}
          variant="compact"
        />

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <ProgressBar
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onStepPress={handleStepPress}
          />
          <Text style={styles.stepTitle}>{STEP_TITLES[currentStep]}</Text>
        </View>

        {/* Content */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {renderStepContent()}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity onPress={handlePrevious}>
              <Text>Geri</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={currentStep === TOTAL_STEPS - 1 ? handleSubmit : handleNext}
          >
            <Text>{currentStep === TOTAL_STEPS - 1 ? 'Kaydet' : 'Devam Et'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModalProvider>
  )
}
```

## State Management Pattern

### useReducer (Karmaşık formlar için)

```typescript
// hooks/module/useFormReducer.ts
export interface FormState {
  field1: string
  field2: number
  items: ItemType[]
}

type FormAction =
  | { type: 'SET_FIELD1'; payload: string }
  | { type: 'ADD_ITEM' }
  | { type: 'LOAD_FROM_API'; payload: any }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD1':
      return { ...state, field1: action.payload }
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, getDefaultItem()] }
    default:
      return state
  }
}

export function useFormReducer() {
  const [state, dispatch] = useReducer(formReducer, initialState)

  const actions = {
    setField1: useCallback((value: string) =>
      dispatch({ type: 'SET_FIELD1', payload: value }), []),
    addItem: useCallback(() =>
      dispatch({ type: 'ADD_ITEM' }), [])
  }

  return { state, actions }
}
```

### Submit Hook

```typescript
// hooks/module/useFormSubmit.ts
export function useFormSubmit(editId?: number | null) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitForm = async (formState: FormState) => {
    setIsSubmitting(true)
    try {
      const payload = transformStateToPayload(formState)

      if (editId) {
        await updateItem(editId, payload)
        Toast.show({ type: 'success', text1: 'Güncellendi', position: 'top', visibilityTime: 1500 })
      } else {
        await createItem(payload)
        Toast.show({ type: 'success', text1: 'Oluşturuldu', position: 'top', visibilityTime: 1500 })
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTimeout(() => router.back(), 300)
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'İşlem başarısız',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, submitForm }
}
```

## Checklist

- [ ] Container: `backgroundColor: DashboardColors.primary`
- [ ] KeyboardView: `backgroundColor: DashboardColors.background`
- [ ] `PageHeader` component kullan
- [ ] `showBackButton` prop'u
- [ ] `rightAction` ile submit butonu + `isLoading`
- [ ] `variant="compact"` kullan
- [ ] KeyboardAvoidingView
- [ ] ScrollView + `keyboardShouldPersistTaps="handled"`
- [ ] Toast bildirimleri
- [ ] Loading states
