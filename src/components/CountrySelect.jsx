const countries = [
    { code: "+1", label: "🇺🇸 United States (+1)" },
    { code: "+52", label: "🇲🇽 Mexico (+52)" },
    { code: "+57", label: "🇨🇴 Colombia (+57)" },
    { code: "+44", label: "🇬🇧 United Kingdom (+44)" },
    { code: "+91", label: "🇮🇳 India (+91)" },
    { code: "+34", label: "🇪🇸 Spain (+34)" },
    { code: "+49", label: "🇩🇪 Germany (+49)" },
    { code: "+33", label: "🇫🇷 France (+33)" },
    { code: "+39", label: "🇮🇹 Italy (+39)" },
    { code: "+61", label: "🇦🇺 Australia (+61)" },
    { code: "+55", label: "🇧🇷 Brazil (+55)" },
    { code: "+86", label: "🇨🇳 China (+86)" },
    { code: "+81", label: "🇯🇵 Japan (+81)" },
    { code: "+7", label: "🇷🇺 Russia (+7)" },
    { code: "+971", label: "🇦🇪 United Arab Emirates (+971)" },
    { code: "+358", label: "🇫🇮 Finland (+358)" },
    { code: "+46", label: "🇸🇪 Sweden (+46)" },
    { code: "+63", label: "🇵🇭 Philippines (+63)" },
    { code: "+62", label: "🇮🇩 Indonesia (+62)" },
    { code: "+31", label: "🇳🇱 Netherlands (+31)" },
    { code: "+41", label: "🇨🇭 Switzerland (+41)" },
    { code: "+32", label: "🇧🇪 Belgium (+32)" },
    { code: "+48", label: "🇵🇱 Poland (+48)" },
    { code: "+1", label: "🇨🇦 Canada (+1)" },
    { code: "+1", label: "🇵🇷 Puerto Rico (+1)" },
    { code: "+20", label: "🇪🇬 Egypt (+20)" },
    { code: "+212", label: "🇲🇦 Morocco (+212)" },
    { code: "+234", label: "🇳🇬 Nigeria (+234)" },
    { code: "+213", label: "🇩🇿 Algeria (+213)" },
    { code: "+27", label: "🇿🇦 South Africa (+27)" },
    { code: "+256", label: "🇺🇬 Uganda (+256)" },
  ];
  
  export default function CountrySelect({ value, onChange }) {
    return (
      <div id="country_container" className="container">
        <div className="form-group">
          <label htmlFor="country_code">Country</label>
          <select id="country_code" value={value} onChange={onChange} required>
            <option value="">Select your country</option>
            {countries.map((c) => (
              <option key={c.code + c.label} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          
        </div>
      </div>
    );
  }
  