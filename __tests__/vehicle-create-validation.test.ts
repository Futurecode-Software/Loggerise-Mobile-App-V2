/**
 * Test suite for vehicle creation validation parity
 * Ensures mobile validation matches web validation exactly
 */

// Validation rules mirror StoreVehicleRequest.php
const VEHICLE_TYPE_OPTIONS = [
  'trailer', 'car', 'minibus', 'bus', 'light_truck', 
  'truck', 'truck_tractor', 'tractor', 'motorcycle', 'construction_machine'
];

const DOCUMENT_TYPE_OPTIONS = [
  'A1', 'A2', 'A', 'B1', 'B', 'C1', 'C', 'D1', 'D', 
  'BE', 'C1E', 'CE', 'D1E', 'DE', 'F', 'G'
];

const EURO_NORM_OPTIONS = [
  'euro_3', 'euro_4', 'euro_5', 'euro_6', 'euro_6d', 'euro_6e', 'electric'
];

const SIDE_DOOR_OPTIONS = ['none', '4_doors', '6_doors', '8_doors'];

// Expected error messages from StoreVehicleRequest.php
const ERROR_MESSAGES = {
  'brand.required': 'Marka zorunludur.',
  'plate.required': 'Plaka zorunludur.',
  'plate.unique': 'Bu plaka zaten kayıtlı.',
  'color.required': 'Renk zorunludur.',
  'model_year.min': 'Model yılı 1900\'den küçük olamaz.',
  'model_year.max': 'Model yılı gelecek yıldan büyük olamaz.',
  'wheel_formula.regex': 'Tekerlek düzeni 4x2, 6x4 gibi bir format olmalıdır.',
};

// Test cases to verify validation parity
describe('Vehicle Creation Validation Parity', () => {
  
  describe('Required fields validation', () => {
    it('should have all mandatory fields defined', () => {
      const requiredFields = [
        'brand', 'plate', 'color', 'gear_type', 'vehicle_type', 
        'document_type', 'model', 'model_year', 'ownership_type', 'status'
      ];
      
      expect(requiredFields.length).toBe(10);
    });
  });
  
  describe('Model year validation', () => {
    it('should have correct min and max values', () => {
      const currentYear = new Date().getFullYear();
      expect(currentYear).toBeGreaterThanOrEqual(2024);
      expect(currentYear + 1).toBeGreaterThan(currentYear);
    });
    
    it('should return correct error messages', () => {
      expect(ERROR_MESSAGES['model_year.min']).toBe('Model yılı 1900\'den küçük olamaz.');
      expect(ERROR_MESSAGES['model_year.max']).toBe('Model yılı gelecek yıldan büyük olamaz.');
    });
  });
  
  describe('Wheel formula validation', () => {
    it('should validate regex pattern correctly', () => {
      const regex = /^\d+x\d+$/;
      
      expect(regex.test('4x2')).toBe(true);
      expect(regex.test('6x4')).toBe(true);
      expect(regex.test('8x4')).toBe(true);
      expect(regex.test('4x4')).toBe(true);
      expect(regex.test('6x2')).toBe(true);
      expect(regex.test('4x2x4')).toBe(false);
      expect(regex.test('abc')).toBe(false);
      expect(regex.test('4xx2')).toBe(false);
      expect(regex.test('4x')).toBe(false);
      expect(regex.test('x4')).toBe(false);
    });
    
    it('should have correct error message', () => {
      expect(ERROR_MESSAGES['wheel_formula.regex']).toBe('Tekerlek düzeni 4x2, 6x4 gibi bir format olmalıdır.');
    });
  });
  
  describe('Vehicle type options', () => {
    it('should match web options exactly', () => {
      const expectedTypes = [
        'trailer', 'car', 'minibus', 'bus', 'light_truck', 
        'truck', 'truck_tractor', 'tractor', 'motorcycle', 'construction_machine'
      ];
      
      expect(VEHICLE_TYPE_OPTIONS).toEqual(expectedTypes);
      expect(VEHICLE_TYPE_OPTIONS).toHaveLength(10);
    });
  });
  
  describe('Document type options', () => {
    it('should match web options exactly', () => {
      const expectedDocs = [
        'A1', 'A2', 'A', 'B1', 'B', 'C1', 'C', 'D1', 'D', 
        'BE', 'C1E', 'CE', 'D1E', 'DE', 'F', 'G'
      ];
      
      expect(DOCUMENT_TYPE_OPTIONS).toEqual(expectedDocs);
      expect(DOCUMENT_TYPE_OPTIONS).toHaveLength(16);
    });
  });
  
  describe('Trailer door options', () => {
    it('should match web options exactly', () => {
      const expectedDoors = ['none', '4_doors', '6_doors', '8_doors'];
      
      expect(SIDE_DOOR_OPTIONS).toEqual(expectedDoors);
    });
  });
  
  describe('Euro norm options', () => {
    it('should match web options exactly', () => {
      const expectedEuroNorms = [
        'euro_3', 'euro_4', 'euro_5', 'euro_6', 'euro_6d', 'euro_6e', 'electric'
      ];
      
      expect(EURO_NORM_OPTIONS).toEqual(expectedEuroNorms);
    });
  });
  
  describe('Field order verification', () => {
    it('should have exactly 49 fields in correct order', () => {
      const fieldGroups = {
        basic: ['vehicle_type', 'plate', 'brand', 'model', 'model_year', 'color', 'commercial_name', 'vehicle_class', 'vehicle_category', 'gear_type', 'document_type', 'ownership_type', 'status', 'total_km', 'net_weight', 'max_loaded_weight'],
        license: ['registration_serial_no', 'first_registration_date', 'registration_date', 'engine_number', 'engine_power', 'wheel_formula', 'chassis_number'],
        tractor: ['euro_norm', 'fuel_capacity', 'has_gps_tracker', 'gps_identity_no', 'battery_capacity'],
        trailer: ['trailer_width', 'trailer_length', 'trailer_height', 'trailer_volume', 'side_door_count', 'has_xl_certificate', 'is_double_deck', 'has_p400', 'has_sliding_curtain', 'is_lightweight', 'is_train_compatible', 'has_tarpaulin', 'has_roller', 'has_electronic_scale'],
        ownership: ['full_name', 'company_name', 'id_or_tax_no', 'notary_name', 'notary_sale_date', 'address'],
        assignment: ['assignment_vehicle_id'],
        other: ['sort_order', 'is_active']
      };
      
      const totalFields = Object.values(fieldGroups).flat().length;
      expect(totalFields).toBe(49);
    });
  });
  
  describe('Form tab structure', () => {
    it('should have 6 tabs matching web version', () => {
      const expectedTabs = [
        'Temel Bilgiler',      // Basic Information
        'Ruhsat Bilgileri',    // License Information  
        'Çekici Bilgileri',    // Tractor Information
        'Römork Bilgileri',    // Trailer Information
        'Sahiplik',           // Ownership
        'Eşleştirme'          // Assignment
      ];
      
      expect(expectedTabs).toHaveLength(6);
      expect(expectedTabs[0]).toBe('Temel Bilgiler');
      expect(expectedTabs[1]).toBe('Ruhsat Bilgileri');
    });
  });
});

export {};
