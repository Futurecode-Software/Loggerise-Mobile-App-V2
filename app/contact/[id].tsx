import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  Edit,
  Trash2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building,
  FileText,
  Copy,
  Check,
  Plus,
  User,
  Briefcase,
  Hash,
  AlertCircle,
  RefreshCw,
  MoreVertical,
} from 'lucide-react-native';
import { Card, Badge, Avatar, Button, Skeleton, ConfirmDialog } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import AddressFormSheet, { AddressFormSheetRef } from '@/components/contact/address-form-sheet';
import AuthorityFormSheet, { AuthorityFormSheetRef } from '@/components/contact/authority-form-sheet';
import { Colors, Typography, Spacing, Brand, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import {
  getContact,
  deleteContact,
  deleteContactAddress,
  deleteContactAuthority,
  ContactDetail,
  ContactAddress,
  ContactAuthority,
} from '@/services/endpoints/contacts';

type TabType = 'info' | 'addresses' | 'authorities';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Her zaman light mode kullanilir
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Delete dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteAddressDialog, setShowDeleteAddressDialog] = useState(false);
  const [showDeleteAuthorityDialog, setShowDeleteAuthorityDialog] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<ContactAddress | null>(null);
  const [authorityToDelete, setAuthorityToDelete] = useState<ContactAuthority | null>(null);

  // Adres form sheet ref
  const addressSheetRef = useRef<AddressFormSheetRef>(null);
  const [editingAddress, setEditingAddress] = useState<ContactAddress | null>(null);

  // Yetkili form sheet ref
  const authoritySheetRef = useRef<AuthorityFormSheetRef>(null);
  const [editingAuthority, setEditingAuthority] = useState<ContactAuthority | null>(null);

  // Veriyi çek
  const fetchContact = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getContact(Number(id));
      setContact(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cari bilgisi yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  // Yenileme
  const handleRefresh = () => {
    setRefreshing(true);
    fetchContact();
  };

  // Kopyalama
  const handleCopy = async (field: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Telefon arama
  const handleCall = (phoneNumber: string) => {
    const url = `tel:${phoneNumber.replace(/\s/g, '')}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      }
    });
  };

  // E-posta gönderme
  const handleEmail = (email: string) => {
    const url = `mailto:${email}`;
    Linking.openURL(url);
  };

  // Cari Silme
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteContact = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteContact(Number(id));
      setShowDeleteDialog(false);
      success('Başarılı', 'Cari silindi.');
      router.back();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Silme işlemi başarısız');
      setDeleting(false);
    }
  };

  // ============================================
  // ADRES İŞLEMLERİ
  // ============================================

  // Yeni adres ekle
  const handleAddAddress = () => {
    setEditingAddress(null);
    addressSheetRef.current?.present();
  };

  // Adres düzenle
  const handleEditAddress = (address: ContactAddress) => {
    setEditingAddress(address);
    addressSheetRef.current?.present();
  };

  // Adres sil
  const handleDeleteAddress = (address: ContactAddress) => {
    setAddressToDelete(address);
    setShowDeleteAddressDialog(true);
  };

  const confirmDeleteAddress = async () => {
    if (!id || !addressToDelete) return;
    try {
      await deleteContactAddress(Number(id), addressToDelete.id);
      setShowDeleteAddressDialog(false);
      setAddressToDelete(null);
      success('Başarılı', 'Adres silindi.');
      fetchContact();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Silme işlemi başarısız');
    }
  };

  // Adres form başarılı
  const handleAddressSuccess = () => {
    fetchContact(); // Listeyi yenile
  };

  // ============================================
  // YETKİLİ İŞLEMLERİ
  // ============================================

  // Yeni yetkili ekle
  const handleAddAuthority = () => {
    setEditingAuthority(null);
    authoritySheetRef.current?.present();
  };

  // Yetkili düzenle
  const handleEditAuthority = (authority: ContactAuthority) => {
    setEditingAuthority(authority);
    authoritySheetRef.current?.present();
  };

  // Yetkili sil
  const handleDeleteAuthority = (authority: ContactAuthority) => {
    setAuthorityToDelete(authority);
    setShowDeleteAuthorityDialog(true);
  };

  const confirmDeleteAuthority = async () => {
    if (!id || !authorityToDelete) return;
    try {
      await deleteContactAuthority(Number(id), authorityToDelete.id);
      setShowDeleteAuthorityDialog(false);
      setAuthorityToDelete(null);
      success('Başarılı', 'Yetkili silindi.');
      fetchContact();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Silme işlemi başarısız');
    }
  };

  // Yetkili form başarılı
  const handleAuthoritySuccess = () => {
    fetchContact(); // Listeyi yenile
  };

  // Adres formatla
  const formatAddress = (addressItem: ContactAddress): string => {
    const parts: string[] = [];
    if (addressItem.address) parts.push(addressItem.address);

    const locationParts: string[] = [];
    if (addressItem.city?.name) locationParts.push(addressItem.city.name);
    if (addressItem.state?.name) locationParts.push(addressItem.state.name);
    if (addressItem.country?.name) locationParts.push(addressItem.country.name);
    if (addressItem.postal_code) locationParts.push(addressItem.postal_code);

    if (locationParts.length > 0) {
      parts.push(locationParts.join(', '));
    }

    return parts.join('\n') || 'Adres bilgisi yok';
  };

  // Adres tipi label - based on is_billing and is_shipping flags
  const getAddressTypeLabel = (addressItem: ContactAddress): string => {
    if (addressItem.is_billing && addressItem.is_shipping) {
      return 'Fatura & Sevkiyat';
    } else if (addressItem.is_billing) {
      return 'Fatura';
    } else if (addressItem.is_shipping) {
      return 'Sevkiyat';
    } else if (addressItem.is_main) {
      return 'Ana Adres';
    }
    return 'Genel';
  };

  // Contact tipi label - based on type field (customer, supplier, both, etc.)
  const getContactTypeLabel = (type: ContactDetail['type']): string => {
    switch (type) {
      case 'customer':
        return 'Müşteri';
      case 'supplier':
        return 'Tedarikçi';
      case 'both':
        return 'Müşteri & Tedarikçi';
      case 'self':
        return 'Kendi Firmam';
      case 'potential':
        return 'Potansiyel';
      case 'other':
        return 'Diğer';
      default:
        return type;
    }
  };

  // Legal type label
  const getLegalTypeLabel = (legalType: ContactDetail['legal_type']): string => {
    switch (legalType) {
      case 'company':
        return 'Şirket';
      case 'individual':
        return 'Bireysel';
      case 'government':
        return 'Kamu';
      case 'public':
        return 'Tüzel';
      default:
        return legalType;
    }
  };

  // Contact rol label - based on is_customer and is_supplier computed fields
  const getContactRoleLabel = (contact: ContactDetail): string => {
    const roles: string[] = [];
    if (contact.is_customer) roles.push('Müşteri');
    if (contact.is_supplier) roles.push('Tedarikçi');
    return roles.length > 0 ? roles.join(' & ') : getContactTypeLabel(contact.type);
  };

  // Status badge variant
  const getStatusVariant = (
    status: ContactDetail['status']
  ): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'passive':
        return 'warning';
      case 'blacklist':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Status label
  const getStatusLabel = (status: ContactDetail['status']): string => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'passive':
        return 'Pasif';
      case 'blacklist':
        return 'Kara Liste';
      default:
        return status;
    }
  };

  // Loading skeleton
  const renderLoadingSkeleton = () => (
    <View style={styles.content}>
      {/* Hero Skeleton */}
      <View style={styles.heroSection}>
        <Skeleton width={80} height={80} borderRadius={40} />
        <Skeleton width={200} height={24} style={{ marginTop: Spacing.md }} />
        <Skeleton width={100} height={24} style={{ marginTop: Spacing.sm }} />
        <View style={[styles.statsRow, { marginTop: Spacing.xl }]}>
          <Skeleton width={60} height={40} />
          <Skeleton width={60} height={40} />
          <Skeleton width={60} height={40} />
        </View>
      </View>

      {/* Tabs Skeleton */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <Skeleton width={80} height={20} />
        <Skeleton width={80} height={20} />
        <Skeleton width={80} height={20} />
      </View>

      {/* Content Skeleton */}
      <View style={styles.section}>
        <Skeleton width={120} height={16} style={{ marginBottom: Spacing.sm }} />
        <Card variant="outlined" padding="none">
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Skeleton width={36} height={36} borderRadius={18} />
              <View style={[styles.infoContent, { marginLeft: Spacing.md }]}>
                <Skeleton width={60} height={14} />
                <Skeleton width={150} height={16} style={{ marginTop: 4 }} />
              </View>
            </View>
          ))}
        </Card>
      </View>
    </View>
  );

  // Error state
  const renderError = () => (
    <View style={styles.errorContainer}>
      <AlertCircle size={48} color={colors.danger} />
      <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      <Button
        title="Tekrar Dene"
        onPress={fetchContact}
        icon={<RefreshCw size={18} color="#FFFFFF" />}
        style={{ marginTop: Spacing.lg }}
      />
    </View>
  );

  // Bilgiler tab
  const renderInfoTab = () => {
    if (!contact) return null;

    return (
      <>
        {/* İletişim Bilgileri */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            İletişim Bilgileri
          </Text>
          <Card variant="outlined" padding="none">
            {contact.email && (
              <InfoRow
                icon={<Mail size={18} color={colors.icon} />}
                label="E-posta"
                value={contact.email}
                copyable
                onCopy={() => handleCopy('email', contact.email!)}
                isCopied={copiedField === 'email'}
                colors={colors}
                isLast={!contact.phone}
              />
            )}
            {contact.phone && (
              <InfoRow
                icon={<Phone size={18} color={colors.icon} />}
                label="Telefon"
                value={contact.phone}
                copyable
                onCopy={() => handleCopy('phone', contact.phone!)}
                isCopied={copiedField === 'phone'}
                colors={colors}
                isLast
              />
            )}
            {!contact.email && !contact.phone && (
              <View style={styles.emptyRow}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  İletişim bilgisi bulunamadı
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* Vergi Bilgileri */}
        {(contact.tax_office || contact.tax_number || contact.identity_number) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Vergi / Kimlik Bilgileri
            </Text>
            <Card variant="outlined" padding="none">
              {contact.tax_office && (
                <InfoRow
                  icon={<Building size={18} color={colors.icon} />}
                  label="Vergi Dairesi"
                  value={contact.tax_office.name}
                  colors={colors}
                  isLast={!contact.tax_number && !contact.identity_number}
                />
              )}
              {contact.tax_number && (
                <InfoRow
                  icon={<FileText size={18} color={colors.icon} />}
                  label="Vergi No"
                  value={contact.tax_number}
                  copyable
                  onCopy={() => handleCopy('tax', contact.tax_number!)}
                  isCopied={copiedField === 'tax'}
                  colors={colors}
                  isLast={!contact.identity_number}
                />
              )}
              {contact.identity_number && (
                <InfoRow
                  icon={<User size={18} color={colors.icon} />}
                  label="TC Kimlik No"
                  value={contact.identity_number}
                  copyable
                  onCopy={() => handleCopy('identity', contact.identity_number!)}
                  isCopied={copiedField === 'identity'}
                  colors={colors}
                  isLast
                />
              )}
            </Card>
          </View>
        )}

        {/* Genel Bilgiler */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Genel Bilgiler</Text>
          <Card variant="outlined" padding="none">
            <InfoRow
              icon={<Hash size={18} color={colors.icon} />}
              label="Cari Kodu"
              value={contact.code}
              copyable
              onCopy={() => handleCopy('code', contact.code)}
              isCopied={copiedField === 'code'}
              colors={colors}
            />
            <InfoRow
              icon={<Briefcase size={18} color={colors.icon} />}
              label="Cari Tipi"
              value={getContactTypeLabel(contact.type)}
              colors={colors}
            />
            <InfoRow
              icon={<User size={18} color={colors.icon} />}
              label="Cari Rolü"
              value={getContactRoleLabel(contact)}
              colors={colors}
              isLast
            />
          </Card>
        </View>

        {/* Kısa Ad */}
        {contact.short_name && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Diğer</Text>
            <Card variant="outlined" padding="none">
              <InfoRow
                icon={<FileText size={18} color={colors.icon} />}
                label="Kısa Ad"
                value={contact.short_name}
                colors={colors}
                isLast
              />
            </Card>
          </View>
        )}
      </>
    );
  };

  // Adresler tab
  const renderAddressesTab = () => {
    if (!contact) return null;

    const activeAddresses = contact.addresses?.filter((a) => a.is_active) || [];

    return (
      <View style={styles.section}>
        {activeAddresses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <MapPin size={32} color={colors.textMuted} />
            <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>
              Henüz adres eklenmemiş
            </Text>
          </Card>
        ) : (
          activeAddresses.map((address) => (
            <Card key={address.id} style={styles.addressCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.addressHeader}>
                  <Badge
                    label={getAddressTypeLabel(address)}
                    variant={address.is_billing ? 'info' : 'success'}
                    size="sm"
                  />
                  {address.is_main && <Badge label="Ana Adres" variant="default" size="sm" />}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.cardActionButton}
                    onPress={() => handleEditAddress(address)}
                  >
                    <Edit size={16} color={colors.icon} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cardActionButton}
                    onPress={() => handleDeleteAddress(address)}
                  >
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              {address.title && (
                <Text style={[styles.addressTitle, { color: colors.text }]}>{address.title}</Text>
              )}

              <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                {formatAddress(address)}
              </Text>

              {/* Adres iletişim bilgileri */}
              {(address.phone || address.email) && (
                <View style={styles.addressContactInfo}>
                  {address.phone && (
                    <TouchableOpacity
                      style={styles.addressContactRow}
                      onPress={() => handleCall(address.phone!)}
                    >
                      <Phone size={14} color={colors.icon} />
                      <Text style={[styles.addressContactText, { color: colors.textSecondary }]}>
                        {address.phone}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {address.email && (
                    <TouchableOpacity
                      style={styles.addressContactRow}
                      onPress={() => handleEmail(address.email!)}
                    >
                      <Mail size={14} color={colors.icon} />
                      <Text style={[styles.addressContactText, { color: colors.textSecondary }]}>
                        {address.email}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Card>
          ))
        )}

        <Button
          title="Adres Ekle"
          variant="outline"
          fullWidth
          icon={<Plus size={18} color={Brand.primary} />}
          onPress={handleAddAddress}
        />
      </View>
    );
  };

  // Yetkililer tab
  const renderAuthoritiesTab = () => {
    if (!contact) return null;

    const activeAuthorities = contact.authorities?.filter((a) => a.is_active) || [];

    return (
      <View style={styles.section}>
        {activeAuthorities.length === 0 ? (
          <Card style={styles.emptyCard}>
            <User size={32} color={colors.textMuted} />
            <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>
              Henüz yetkili eklenmemiş
            </Text>
          </Card>
        ) : (
          activeAuthorities.map((authority) => (
            <Card key={authority.id} style={styles.authorityCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.authorityHeader}>
                  <Avatar name={authority.name} size="md" />
                  <View style={styles.authorityInfo}>
                    <View style={styles.authorityNameRow}>
                      <Text style={[styles.authorityName, { color: colors.text }]}>
                        {authority.name}
                      </Text>
                      {authority.is_primary && <Badge label="Birincil" variant="info" size="sm" />}
                    </View>
                    {authority.title && (
                      <Text style={[styles.authorityTitle, { color: colors.textSecondary }]}>
                        {authority.title}
                      </Text>
                    )}
                    {authority.department && (
                      <Text style={[styles.authorityDepartment, { color: colors.textMuted }]}>
                        {authority.department}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.cardActionButton}
                    onPress={() => handleEditAuthority(authority)}
                  >
                    <Edit size={16} color={colors.icon} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cardActionButton}
                    onPress={() => handleDeleteAuthority(authority)}
                  >
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.authorityContacts}>
                {authority.phone && (
                  <TouchableOpacity
                    style={styles.authorityContact}
                    onPress={() => handleCall(authority.phone!)}
                  >
                    <Phone size={16} color={colors.icon} />
                    <Text style={[styles.authorityContactText, { color: colors.textSecondary }]}>
                      {authority.phone}
                    </Text>
                  </TouchableOpacity>
                )}
                {authority.mobile && (
                  <TouchableOpacity
                    style={styles.authorityContact}
                    onPress={() => handleCall(authority.mobile!)}
                  >
                    <Phone size={16} color={colors.icon} />
                    <Text style={[styles.authorityContactText, { color: colors.textSecondary }]}>
                      {authority.mobile} (Cep)
                    </Text>
                  </TouchableOpacity>
                )}
                {authority.email && (
                  <TouchableOpacity
                    style={styles.authorityContact}
                    onPress={() => handleEmail(authority.email!)}
                  >
                    <Mail size={16} color={colors.icon} />
                    <Text style={[styles.authorityContactText, { color: colors.textSecondary }]}>
                      {authority.email}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))
        )}

        <Button
          title="Yetkili Ekle"
          variant="outline"
          fullWidth
          icon={<Plus size={18} color={Brand.primary} />}
          onPress={handleAddAuthority}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Full Screen Header */}
      <FullScreenHeader
            title={loading ? 'Yükleniyor...' : contact?.name || 'Cari Detay'}
            subtitle={
              contact
                ? `${contact.code} • ${getContactRoleLabel(contact)}`
                : undefined
            }
            showBackButton
            leftIcon={
              contact ? (
                <Avatar
                  name={contact.name}
                  size="sm"
                />
              ) : undefined
            }
            rightIcons={
              contact ? (
                <>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => router.push(`/contact/${id}/edit` as any)}
                    activeOpacity={0.7}
                  >
                    <Edit size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleDelete}
                    disabled={deleting}
                    activeOpacity={0.7}
                  >
                    {deleting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Trash2 size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </>
              ) : null
            }
          />

          {/* Content */}
          {loading ? (
            renderLoadingSkeleton()
          ) : error ? (
            renderError()
          ) : contact ? (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[Brand.primary]}
                  tintColor={Brand.primary}
                />
              }
            >
              {/* Hero Section */}
              <View style={styles.heroSection}>
                <Avatar name={contact.name} size="xl" />
                <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>

                <View style={styles.badgeRow}>
                  <Badge label={getContactRoleLabel(contact)} variant="info" />
                  <Badge label={getStatusLabel(contact.status)} variant={getStatusVariant(contact.status)} />
                </View>

                {/* Stats - Adres ve Yetkili sayısı */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {contact.addresses?.filter((a) => a.is_active).length || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Adres</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {contact.authorities?.filter((a) => a.is_active).length || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Yetkili</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {getContactTypeLabel(contact.type)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Tip</Text>
                  </View>
                </View>
              </View>

              {/* Tabs */}
              <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
                {(['info', 'addresses', 'authorities'] as TabType[]).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && { borderBottomColor: Brand.primary }]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        { color: activeTab === tab ? Brand.primary : colors.textSecondary },
                        activeTab === tab && styles.activeTabText,
                      ]}
                    >
                      {tab === 'info' ? 'Bilgiler' : tab === 'addresses' ? 'Adresler' : 'Yetkililer'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tab Content */}
              {activeTab === 'info' && renderInfoTab()}
              {activeTab === 'addresses' && renderAddressesTab()}
              {activeTab === 'authorities' && renderAuthoritiesTab()}
            </ScrollView>
          ) : null}

          {/* Floating Actions */}
          {contact && (contact.phone || contact.email) && (
            <View style={[styles.floatingActions, { ...Shadows.lg }]}>
              {contact.phone && (
                <TouchableOpacity
                  style={[styles.floatingButton, { backgroundColor: Brand.primary }]}
                  onPress={() => handleCall(contact.phone!)}
                >
                  <Phone size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {contact.email && (
                <TouchableOpacity
                  style={[
                    styles.floatingButtonSecondary,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => handleEmail(contact.email!)}
                >
                  <Mail size={22} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Delete Contact Confirmation */}
          <ConfirmDialog
            visible={showDeleteDialog}
            title="Cariyi Sil"
            message={`"${contact?.name}" adlı cariyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
            confirmText="Sil"
            cancelText="İptal"
            isDangerous={true}
            isLoading={deleting}
            onConfirm={confirmDeleteContact}
            onCancel={() => setShowDeleteDialog(false)}
          />

          {/* Delete Address Confirmation */}
          <ConfirmDialog
            visible={showDeleteAddressDialog}
            title="Adresi Sil"
            message={`"${addressToDelete?.title}" adresini silmek istediğinize emin misiniz?`}
            confirmText="Sil"
            cancelText="İptal"
            isDangerous={true}
            onConfirm={confirmDeleteAddress}
            onCancel={() => {
              setShowDeleteAddressDialog(false);
              setAddressToDelete(null);
            }}
          />

          {/* Delete Authority Confirmation */}
          <ConfirmDialog
            visible={showDeleteAuthorityDialog}
            title="Yetkiliyi Sil"
            message={`"${authorityToDelete?.name}" adlı yetkiliyi silmek istediğinize emin misiniz?`}
            confirmText="Sil"
            cancelText="İptal"
            isDangerous={true}
            onConfirm={confirmDeleteAuthority}
            onCancel={() => {
              setShowDeleteAuthorityDialog(false);
              setAuthorityToDelete(null);
            }}
          />

          {/* Adres Form Sheet */}
          {contact && (
            <AddressFormSheet
              ref={addressSheetRef}
              contactId={contact.id}
              address={editingAddress}
              onSuccess={handleAddressSuccess}
            />
          )}

          {/* Yetkili Form Sheet */}
          {contact && (
            <AuthorityFormSheet
              ref={authoritySheetRef}
              contactId={contact.id}
              authority={editingAuthority}
              onSuccess={handleAuthoritySuccess}
            />
          )}
    </View>
  );
}

// Helper component for info rows
function InfoRow({
  icon,
  label,
  value,
  copyable,
  onCopy,
  isCopied,
  colors,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copyable?: boolean;
  onCopy?: () => void;
  isCopied?: boolean;
  colors: (typeof Colors)['light'];
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
      {copyable && (
        <TouchableOpacity style={styles.copyButton} onPress={onCopy}>
          {isCopied ? (
            <Check size={18} color={colors.success} />
          ) : (
            <Copy size={18} color={colors.icon} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  contactName: {
    ...Typography.headingLG,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  statValue: {
    ...Typography.headingMD,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.bodySM,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    ...Typography.bodyMD,
  },
  activeTabText: {
    fontWeight: '600',
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.bodySM,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyRow: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodySM,
  },
  infoIcon: {
    width: 36,
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...Typography.bodySM,
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.bodyMD,
  },
  copyButton: {
    padding: Spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    marginBottom: Spacing.md,
  },
  emptyCardText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  addressCard: {
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  cardActionButton: {
    padding: Spacing.xs,
  },
  addressHeader: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flex: 1,
    flexWrap: 'wrap',
  },
  addressTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  addressText: {
    ...Typography.bodyMD,
    lineHeight: 22,
  },
  addressContactInfo: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  addressContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  addressContactText: {
    ...Typography.bodySM,
  },
  authorityCard: {
    marginBottom: Spacing.md,
  },
  authorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorityInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  authorityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  authorityName: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  authorityTitle: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  authorityDepartment: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  authorityContacts: {
    marginBottom: Spacing.sm,
  },
  authorityContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  authorityContactText: {
    ...Typography.bodySM,
  },
  floatingActions: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    right: Spacing.lg,
    gap: Spacing.sm,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButtonSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    alignSelf: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
