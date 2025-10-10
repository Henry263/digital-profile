// countries-autocomplete.js

class CountryAutocomplete {
    constructor(inputId, dropdownId) {
        this.input = document.getElementById(inputId);
        this.dropdown = document.getElementById(dropdownId);
        this.countries = [];
        this.selectedIndex = -1;
        this.isLoading = true;

        this.init();
    }

    async init() {
        // Show loading state
        this.showLoading();

        // Load countries from API
        await this.loadCountries();

        // Set up event listeners
        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.input.addEventListener('focus', (e) => this.handleInput(e));
        this.input.addEventListener('blur', () => {
            setTimeout(() => this.hideDropdown(), 200);
        });

        this.isLoading = false;
    }

    async loadCountries() {
        try {
            const response = await fetch('https://restcountries.com/v3.1/all');

            if (!response.ok) {
                throw new Error('Failed to fetch countries');
            }

            const data = await response.json();

            this.countries = data
                .map(country => ({
                    name: country.name.common,
                    code: country.cca2,
                    flag: country.flag || ''
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            console.log(`Loaded ${this.countries.length} countries`);

        } catch (error) {
            console.error('Error loading countries from API:', error);
            // Fallback to static list
            this.countries = this.getFallbackCountries();
        }
    }


    getFallbackCountries() {
        // Static fallback list
        return [
            { name: "Afghanistan", code: "AF" },
            { name: "Albania", code: "AL" },
            { name: "Algeria", code: "DZ" },
            { name: "Argentina", code: "AR" },
            { name: "Australia", code: "AU" },
            { name: "Austria", code: "AT" },
            { name: "Bangladesh", code: "BD" },
            { name: "Belgium", code: "BE" },
            { name: "Brazil", code: "BR" },
            { name: "Canada", code: "CA" },
            { name: "China", code: "CN" },
            { name: "Denmark", code: "DK" },
            { name: "Egypt", code: "EG" },
            { name: "France", code: "FR" },
            { name: "Germany", code: "DE" },
            { name: "India", code: "IN" },
            { name: "Indonesia", code: "ID" },
            { name: "Ireland", code: "IE" },
            { name: "Italy", code: "IT" },
            { name: "Japan", code: "JP" },
            { name: "Mexico", code: "MX" },
            { name: "Netherlands", code: "NL" },
            { name: "New Zealand", code: "NZ" },
            { name: "Norway", code: "NO" },
            { name: "Pakistan", code: "PK" },
            { name: "Philippines", code: "PH" },
            { name: "Poland", code: "PL" },
            { name: "Portugal", code: "PT" },
            { name: "Russia", code: "RU" },
            { name: "Saudi Arabia", code: "SA" },
            { name: "Singapore", code: "SG" },
            { name: "South Africa", code: "ZA" },
            { name: "South Korea", code: "KR" },
            { name: "Spain", code: "ES" },
            { name: "Sweden", code: "SE" },
            { name: "Switzerland", code: "CH" },
            { name: "Thailand", code: "TH" },
            { name: "Turkey", code: "TR" },
            { name: "United Arab Emirates", code: "AE" },
            { name: "United Kingdom", code: "GB" },
            { name: "United States", code: "US" },
            { name: "Vietnam", code: "VN" }
        ].sort((a, b) => a.name.localeCompare(b.name));
    }

    handleInput(e) {
        if (this.isLoading) {
            this.showLoading();
            return;
        }

        const value = e.target.value.trim().toLowerCase();

        if (value.length < 1) {
            this.hideDropdown();
            return;
        }

        const matches = this.countries.filter(country =>
            country.name.toLowerCase().includes(value)
        );

        this.showDropdown(matches);
    }

    handleKeydown(e) {
        const items = this.dropdown.querySelectorAll('.dropdown-item:not(.loading)');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
            this.updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
            this.updateSelection(items);
        } else if (e.key === 'Enter' && this.selectedIndex >= 0) {
            e.preventDefault();
            items[this.selectedIndex].click();
        } else if (e.key === 'Escape') {
            this.hideDropdown();
        }
    }

    updateSelection(items) {
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });

        if (items[this.selectedIndex]) {
            items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    showLoading() {
        this.dropdown.innerHTML = '<div class="dropdown-item loading">Loading countries...</div>';
        this.dropdown.style.display = 'block';
    }

    showDropdown(matches) {
        this.dropdown.innerHTML = '';
        this.selectedIndex = -1;

        if (matches.length === 0) {
            this.dropdown.innerHTML = '<div class="dropdown-item no-results">No countries found</div>';
            this.dropdown.style.display = 'block';
            return;
        }

        // Show max 10 results
        matches.slice(0, 10).forEach((country, index) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';

            // Add flag emoji if available
            const flagText = country.flag ? `${country.flag} ` : '';
            item.innerHTML = `${flagText}<span class="country-name">${country.name}</span>`;

            item.addEventListener('click', () => this.selectCountry(country.name));
            this.dropdown.appendChild(item);
        });

        this.dropdown.style.display = 'block';
    }

    hideDropdown() {
        this.dropdown.style.display = 'none';
        this.selectedIndex = -1;
    }

    selectCountry(countryName) {
        this.input.value = countryName;
        this.hideDropdown();

        // Trigger change event for form validation
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
}


/**
   * =====  Implementation to load the country city and stage
   */
class LocationAutocomplete {
    constructor() {
        this.countries = [];
        this.currentStates = [];
        this.currentCities = [];
        this.selectedCountry = null;
        this.selectedState = null;
        this.selectedCity = null;
        this.currentSelectedIndex = -1;
        this.activeDropdown = null; // Track which dropdown is active

        // Store filtered results for keyboard navigation
        this.filteredCountries = [];
        this.filteredStates = [];
        this.filteredCities = [];

        this.initAutocomplete();
    }

    getFilteredCountries() {
        return this.filteredCountries;
    }

    getFilteredStates() {
        return this.filteredStates;
    }

    getFilteredCities() {
        return this.filteredCities;
    }

    handleCountryInput(query) {
        const dropdown = document.getElementById('countryDropdown');

        if (!query || query.length < 1) {
            dropdown.classList.remove('active');
            this.filteredCountries = [];
            return;
        }

        this.filteredCountries = this.countries.filter(country =>
            country.name.toLowerCase().includes(query.toLowerCase())
        );

        this.displayCountryResults(this.filteredCountries, dropdown);
    }

    handleStateInput(query) {
        const dropdown = document.getElementById('stateDropdown');

        if (!query || query.length < 1) {
            dropdown.classList.remove('active');
            this.filteredStates = [];
            return;
        }

        this.filteredStates = this.currentStates.filter(state =>
            state.name.toLowerCase().includes(query.toLowerCase())
        );

        this.displayStateResults(this.filteredStates, dropdown);
    }

    handleCityInput(query) {
        const dropdown = document.getElementById('cityDropdown');

        if (!query || query.length < 1) {
            dropdown.classList.remove('active');
            this.filteredCities = [];
            return;
        }

        this.filteredCities = this.currentCities.filter(city =>
            city.name.toLowerCase().includes(query.toLowerCase())
        );

        this.displayCityResults(this.filteredCities, dropdown);
    }
    async loadCountries() {
        try {
            const response = await fetch('/data/countries_states_cities.json');

            if (!response.ok) {
                throw new Error('Failed to load countries data');
            }

            const data = await response.json();

            this.countries = data.map(country => ({
                name: country.name,
                code: country.iso2,
                iso3: country.iso3,
                flag: country.emoji || '🌍',
                phonecode: country.phonecode,
                currency: country.currency,
                region: country.region,
                states: country.states || []
            }));

            // console.log(`✅ Loaded ${this.countries.length} countries`);

        } catch (error) {
            console.error('❌ Error loading countries:', error);
        }
    }

    initAutocomplete() {
        const countryInput = document.getElementById('country');
        const countryDropdown = document.getElementById('countryDropdown');

        if (countryInput) {
            countryInput.addEventListener('input', (e) => {
                this.currentSelectedIndex = -1;
                this.handleCountryInput(e.target.value);
            });

            countryInput.addEventListener('focus', () => {
                this.activeDropdown = 'country';
                if (countryInput.value) {
                    this.handleCountryInput(countryInput.value);
                }
            });

            countryInput.addEventListener('blur', () => {
                // Small delay to allow click on dropdown item
                setTimeout(() => {
                    if (this.activeDropdown === 'country') {
                        this.activeDropdown = null;
                    }
                }, 200);
            });

            countryInput.addEventListener('keydown', (e) => {
                // Only handle if this field is focused and dropdown is open
                if (document.activeElement === countryInput && countryDropdown.classList.contains('active')) {
                    this.handleKeyboardNavigation(e, 'countryDropdown');
                }
            });

            document.addEventListener('click', (e) => {
                if (!countryInput.contains(e.target) && !countryDropdown.contains(e.target)) {
                    countryDropdown.classList.remove('active');
                    this.currentSelectedIndex = -1;
                }
            });
        }

        const stateInput = document.getElementById('state');
        const stateDropdown = document.getElementById('stateDropdown');

        if (stateInput) {
            stateInput.addEventListener('input', (e) => {
                this.currentSelectedIndex = -1;
                this.handleStateInput(e.target.value);
            });

            stateInput.addEventListener('focus', () => {
                this.activeDropdown = 'state';
                if (stateInput.value) {
                    this.handleStateInput(stateInput.value);
                }
            });

            stateInput.addEventListener('blur', () => {
                setTimeout(() => {
                    if (this.activeDropdown === 'state') {
                        this.activeDropdown = null;
                    }
                }, 200);
            });

            stateInput.addEventListener('keydown', (e) => {
                // Only handle if this field is focused and dropdown is open
                if (document.activeElement === stateInput && stateDropdown.classList.contains('active')) {
                    this.handleKeyboardNavigation(e, 'stateDropdown');
                }
            });

            document.addEventListener('click', (e) => {
                if (!stateInput.contains(e.target) && !stateDropdown.contains(e.target)) {
                    stateDropdown.classList.remove('active');
                    this.currentSelectedIndex = -1;
                }
            });
        }

        const cityInput = document.getElementById('city');
        const cityDropdown = document.getElementById('cityDropdown');

        if (cityInput) {
            cityInput.addEventListener('input', (e) => {
                this.currentSelectedIndex = -1;
                if (this.currentCities.length > 0) {
                    this.handleCityInput(e.target.value);
                }
            });

            cityInput.addEventListener('focus', () => {
                this.activeDropdown = 'city';
                if (cityInput.value && this.currentCities.length > 0) {
                    this.handleCityInput(cityInput.value);
                }
            });

            cityInput.addEventListener('blur', () => {
                setTimeout(() => {
                    if (this.activeDropdown === 'city') {
                        this.activeDropdown = null;
                    }
                }, 200);
            });

            cityInput.addEventListener('keydown', (e) => {
                // Only handle if this field is focused and dropdown is open
                if (document.activeElement === cityInput && this.currentCities.length > 0 && cityDropdown.classList.contains('active')) {
                    this.handleKeyboardNavigation(e, 'cityDropdown');
                }
            });

            document.addEventListener('click', (e) => {
                if (!cityInput.contains(e.target) && !cityDropdown.contains(e.target)) {
                    cityDropdown.classList.remove('active');
                    this.currentSelectedIndex = -1;
                }
            });
        }
    }

    handleKeyboardNavigation(e, dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        
        if (!dropdown || !dropdown.classList.contains('active')) {
          return;
        }
        
        const items = dropdown.querySelectorAll('.autocomplete-item');
        
        if (items.length === 0) return;
        
        switch(e.key) {
          case 'ArrowDown':
            e.preventDefault();
            e.stopPropagation();
            this.currentSelectedIndex = (this.currentSelectedIndex + 1) % items.length;
            this.updateSelection(items);
            break;
            
          case 'ArrowUp':
            e.preventDefault();
            e.stopPropagation();
            this.currentSelectedIndex = this.currentSelectedIndex <= 0 
              ? items.length - 1 
              : this.currentSelectedIndex - 1;
            this.updateSelection(items);
            break;
            
          case 'Enter':
            e.preventDefault();
            e.stopPropagation();
            
            // Get the selected item (or first if none selected)
            const selectedIndex = this.currentSelectedIndex >= 0 ? this.currentSelectedIndex : 0;
            const selectedItem = items[selectedIndex];
            
            if (selectedItem && selectedItem._data) {
              // Call the appropriate select function based on which dropdown
              if (dropdownId === 'countryDropdown') {
                this.selectCountry(selectedItem._data);
              } else if (dropdownId === 'stateDropdown') {
                this.selectState(selectedItem._data);
              } else if (dropdownId === 'cityDropdown') {
                this.selectCity(selectedItem._data);
              }
            }
            
            dropdown.classList.remove('active');
            this.currentSelectedIndex = -1;
            break;
            
          case 'Escape':
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.remove('active');
            this.currentSelectedIndex = -1;
            break;
            
          case 'Tab':
            dropdown.classList.remove('active');
            this.currentSelectedIndex = -1;
            break;
        }
      }
      
    updateSelection(items) {
        items.forEach(item => item.classList.remove('selected'));

        if (this.currentSelectedIndex >= 0 && items[this.currentSelectedIndex]) {
            items[this.currentSelectedIndex].classList.add('selected');
            items[this.currentSelectedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }

    handleCountryInput(query) {
        const dropdown = document.getElementById('countryDropdown');

        if (!query || query.length < 1) {
            dropdown.classList.remove('active');
            return;
        }

        const filtered = this.countries.filter(country =>
            country.name.toLowerCase().includes(query.toLowerCase())
        );

        this.displayCountryResults(filtered, dropdown);
    }

    displayCountryResults(countries, dropdown) {
        dropdown.innerHTML = '';
        this.currentSelectedIndex = -1;
        
        if (countries.length === 0) {
          dropdown.innerHTML = '<div class="autocomplete-no-results">No countries found</div>';
          dropdown.classList.add('active');
          return;
        }
        
        countries.slice(0, 10).forEach((country, index) => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.innerHTML = `<span class="flag">${country.flag}</span> ${country.name}`;
          
          // Store data directly on the element
          item._data = country;
          item._index = index;
          
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.selectCountry(country);
          });
          
          dropdown.appendChild(item);
        });
        
        dropdown.classList.add('active');
      }
      

    selectCountry(country) {
        this.selectedCountry = country;

        const countryInput = document.getElementById('country');
        const countryCodeInput = document.getElementById('countryCode');
        const countryDropdown = document.getElementById('countryDropdown');

        if (countryInput) countryInput.value = country.name;
        if (countryCodeInput) countryCodeInput.value = country.code;
        if (countryDropdown) countryDropdown.classList.remove('active');

        this.selectedState = null;
        this.selectedCity = null;
        this.currentStates = [];
        this.currentCities = [];
        this.currentSelectedIndex = -1;

        const stateInput = document.getElementById('state');
        const stateIdInput = document.getElementById('stateId');
        if (stateInput) stateInput.value = '';
        if (stateIdInput) stateIdInput.value = '';

        this.resetCity();
        this.loadStates(country);

        console.log('✅ Selected country:', country.name);
    }

    loadStates(country) {
        if (!country.states || country.states.length === 0) {
            this.currentStates = [];
            const stateInput = document.getElementById('state');
            if (stateInput) {
                stateInput.disabled = true;
                stateInput.placeholder = 'No states available';
            }
            return;
        }

        this.currentStates = country.states.map(state => ({
            id: state.id,
            name: state.name,
            code: state.iso2,
            cities: state.cities || []
        }));

        const stateInput = document.getElementById('state');
        if (stateInput) {
            stateInput.disabled = false;
            stateInput.placeholder = 'Start typing state name...';
        }

        // console.log(`✅ Loaded ${this.currentStates.length} states`);
    }

    handleStateInput(query) {
        const dropdown = document.getElementById('stateDropdown');

        if (!query || query.length < 1) {
            dropdown.classList.remove('active');
            return;
        }

        const filtered = this.currentStates.filter(state =>
            state.name.toLowerCase().includes(query.toLowerCase())
        );

        this.displayStateResults(filtered, dropdown);
    }

    displayStateResults(states, dropdown) {
        dropdown.innerHTML = '';
        this.currentSelectedIndex = -1;
        
        if (states.length === 0) {
          dropdown.innerHTML = '<div class="autocomplete-no-results">No states found</div>';
          dropdown.classList.add('active');
          return;
        }
        
        states.slice(0, 10).forEach((state, index) => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.textContent = state.name;
          
           // Add data attribute for state code
    item.setAttribute('data-state-code', state.code);
    item.setAttribute('data-state-id', state.id);

          // Store data directly on the element
          item._data = state;
          item._index = index;
          
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.selectState(state);
          });
          
          dropdown.appendChild(item);
        });
        
        dropdown.classList.add('active');
      }
      

    selectState(state) {
        this.selectedState = state;

        const stateInput = document.getElementById('state');
        const stateIdInput = document.getElementById('stateId');
        const stateCodeInput = document.getElementById('stateCode'); 
        const stateDropdown = document.getElementById('stateDropdown');

        if (stateInput) stateInput.value = state.name;
        if (stateIdInput) stateIdInput.value = state.id;
        if (stateCodeInput) stateCodeInput.value = state.code;
        if (stateDropdown) stateDropdown.classList.remove('active');

        this.selectedCity = null;
        this.currentCities = [];
        this.currentSelectedIndex = -1;

        const cityInput = document.getElementById('city');
        const cityIdInput = document.getElementById('cityId');
        if (cityInput) cityInput.value = '';
        if (cityIdInput) cityIdInput.value = '';

        this.loadCities(state);

        console.log('✅ Selected state:', state.name);
    }

    loadCities(state) {
        if (!state.cities || state.cities.length === 0) {
            this.currentCities = [];
            const cityInput = document.getElementById('city');
            if (cityInput) {
                cityInput.disabled = false;
                cityInput.placeholder = 'Type city name manually...';
            }
            return;
        }

        this.currentCities = state.cities.map(city => ({
            id: city.id,
            name: city.name,
            latitude: city.latitude,
            longitude: city.longitude
        }));

        const cityInput = document.getElementById('city');
        if (cityInput) {
            cityInput.disabled = false;
            cityInput.placeholder = 'Start typing city name...';
        }

        console.log(`✅ Loaded ${this.currentCities.length} cities`);
    }

    handleCityInput(query) {
        const dropdown = document.getElementById('cityDropdown');

        if (!query || query.length < 1) {
            dropdown.classList.remove('active');
            return;
        }

        const filtered = this.currentCities.filter(city =>
            city.name.toLowerCase().includes(query.toLowerCase())
        );

        this.displayCityResults(filtered, dropdown);
    }

    displayCityResults(cities, dropdown) {
        dropdown.innerHTML = '';
        this.currentSelectedIndex = -1;
        
        if (cities.length === 0) {
          dropdown.innerHTML = '<div class="autocomplete-no-results">No cities found - you can type manually</div>';
          dropdown.classList.add('active');
          return;
        }
        
        cities.slice(0, 10).forEach((city, index) => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.textContent = city.name;
          
          // Store data directly on the element
          item._data = city;
          item._index = index;
          
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.selectCity(city);
          });
          
          dropdown.appendChild(item);
        });
        
        dropdown.classList.add('active');
      }
      

    selectCity(city) {
        this.selectedCity = city;

        const cityInput = document.getElementById('city');
        const cityIdInput = document.getElementById('cityId');
        const cityDropdown = document.getElementById('cityDropdown');

        if (cityInput) cityInput.value = city.name;
        if (cityIdInput) cityIdInput.value = city.id;
        if (cityDropdown) cityDropdown.classList.remove('active');

        this.currentSelectedIndex = -1;

        // console.log('✅ Selected city:', city.name);
    }

    resetCity() {
        const cityInput = document.getElementById('city');
        const cityIdInput = document.getElementById('cityId');
        const cityDropdown = document.getElementById('cityDropdown');

        if (cityInput) {
            cityInput.value = '';
            cityInput.disabled = true;
            cityInput.placeholder = 'Select state first...';
        }
        if (cityIdInput) cityIdInput.value = '';
        if (cityDropdown) cityDropdown.classList.remove('active');

        this.selectedCity = null;
        this.currentCities = [];
    }

    getSelectedLocation() {
        const cityInput = document.getElementById('city');
        const cityValue = cityInput ? cityInput.value : null;

        return {
            country: this.selectedCountry,
            state: this.selectedState,
            city: this.selectedCity || { name: cityValue }
        };
    }
}

let locationAutocomplete;

document.addEventListener('DOMContentLoaded', async () => {
    locationAutocomplete = new LocationAutocomplete();
    await locationAutocomplete.loadCountries();
    // console.log('✅ Location autocomplete initialized');
});

//   let locationAutocomplete;

//   document.addEventListener('DOMContentLoaded', async () => {
//     locationAutocomplete = new LocationAutocomplete();
//     await locationAutocomplete.loadCountries();
//     console.log('✅ Location autocomplete initialized');
//   });

// Initialize on page load
// let locationAutocomplete;

// document.addEventListener('DOMContentLoaded', async () => {
//     locationAutocomplete = new LocationAutocomplete();
//     await locationAutocomplete.loadCountries();

//     console.log('✅ Location autocomplete initialized');





// });



  // Add this method to the class

/**
 * ====== End of code ---------
 */



// Initialize when DOM is ready
// document.addEventListener('DOMContentLoaded', () => {
//     const countryAutocomplete = new CountryAutocomplete('country', 'countryDropdown');

//     // Expose globally if needed
//     window.countryAutocomplete = countryAutocomplete;
// });