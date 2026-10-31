import PhoneInput, { CountryData } from 'react-phone-input-2';
import ruLocalization from 'react-phone-input-2/lang/ru.json';
import 'react-phone-input-2/lib/style.css';
import { Language } from '@/lib/i18n';

interface PhoneInputFieldProps {
  lang: Language;
  value: string; // raw digits, no leading "+" (react-phone-input-2 format)
  countryIso2: string; // lowercase, e.g. "uz"
  onChange: (value: string, country: CountryData) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: boolean;
}

/**
 * Professional international phone number input:
 * - 🌍 searchable country dropdown (flag + name + dial code)
 * - supports every country react-phone-input-2 ships (not just Uzbekistan)
 * - styled to match Travel Caravan's dark navy / amber design system via
 *   the ".tc-phone-input" overrides declared in src/index.css
 */
export const PhoneInputField = ({
  lang,
  value,
  countryIso2,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled,
  error
}: PhoneInputFieldProps) => {
  return (
    <PhoneInput
      country={countryIso2 || 'uz'}
      value={value}
      onChange={(val, data) => onChange(val, data as CountryData)}
      enableSearch
      disableSearchIcon={false}
      searchPlaceholder={searchPlaceholder || 'Search country...'}
      placeholder={placeholder}
      disabled={disabled}
      localization={lang === 'ru' ? (ruLocalization as Record<string, string>) : undefined}
      containerClass={`tc-phone-input ${error ? 'tc-phone-input-error' : ''}`}
      inputClass="tc-phone-input-field"
      buttonClass="tc-phone-input-button"
      dropdownClass="tc-phone-input-dropdown"
      searchClass="tc-phone-input-search"
      preferredCountries={['uz', 'ru', 'us', 'gb', 'de', 'fr', 'it', 'tr', 'ae']}
    />
  );
};
