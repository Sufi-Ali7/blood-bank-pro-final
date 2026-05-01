const API = '/api';
let currentUser = JSON.parse(localStorage.getItem('bb_user') || 'null');
let token = localStorage.getItem('bb_token') || '';
let currentLocation = JSON.parse(localStorage.getItem('bb_location') || 'null');
let currentBloodResults = [];
let latestDonations = [];
let inventoryMap;
let inventoryMarkers = [];
let bloodChart;
let donationChart;
let adminInventory = [];


const INDIA_LOCATION_DATA = {
  'andhra pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore'],
  'arunachal pradesh': ['Itanagar', 'Tawang', 'Pasighat', 'Ziro'],
  'assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat'],
  'bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'],
  'chhattisgarh': ['Raipur', 'Bilaspur', 'Durg', 'Korba'],
  'goa': ['Panaji', 'Margao', 'Mapusa', 'Vasco da Gama'],
  'gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  'haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Hisar'],
  'himachal pradesh': ['Shimla', 'Mandi', 'Dharamshala', 'Solan'],
  'jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  'karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'],
  'kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
  'madhya pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior'],
  'maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  'manipur': ['Imphal', 'Churachandpur', 'Thoubal', 'Ukhrul'],
  'meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh'],
  'mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'],
  'nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang'],
  'odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri'],
  'punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  'rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur'],
  'sikkim': ['Gangtok', 'Namchi', 'Geyzing', 'Mangan'],
  'tamil nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
  'telangana': ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad'],
  'tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar'],
  'uttar pradesh': ['Lucknow', 'Kanpur', 'Gorakhpur', 'Varanasi', 'Prayagraj', 'Agra', 'Noida', 'Ghaziabad', 'Meerut', 'Ayodhya'],
  'uttarakhand': ['Dehradun', 'Haridwar', 'Haldwani', 'Roorkee'],
  'west bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'],
  'andaman and nicobar islands': ['Port Blair'],
  'chandigarh': ['Chandigarh'],
  'dadra and nagar haveli and daman and diu': ['Daman', 'Diu', 'Silvassa'],
  'delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Saket'],
  'jammu and kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla'],
  'ladakh': ['Leh', 'Kargil'],
  'lakshadweep': ['Kavaratti'],
  'puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam']
};
const INDIA_STATES = Object.keys(INDIA_LOCATION_DATA);

function isKnownState(value = '') {
  return INDIA_STATES.includes(normalizeValue(value));
}

function isKnownCity(value = '') {
  const normalized = normalizeValue(value);
  return Object.values(INDIA_LOCATION_DATA).some((cities) => cities.some((city) => normalizeValue(city) === normalized));
}

function normalizeUserLocation(user = {}) {
  const normalizedCity = normalizeValue(user.city);
  const normalizedState = normalizeValue(user.state);
  const fixed = { ...user };

  if (normalizedState && !isKnownState(normalizedState) && isKnownCity(normalizedState)) {
    fixed.city = normalizedState;
    fixed.state = inferStateFromCity(normalizedState) || user.state || '';
  }

  if ((!fixed.city || !isKnownCity(fixed.city)) && isKnownCity(user.state)) {
    fixed.city = normalizeValue(user.state);
  }

  if (!fixed.state || !isKnownState(fixed.state)) {
    fixed.state = inferStateFromCity(fixed.city) || 'uttar pradesh';
  }

  if (!fixed.city || !isKnownCity(fixed.city)) {
    const fallbackCities = INDIA_LOCATION_DATA[normalizeValue(fixed.state)] || [];
    fixed.city = normalizeValue(fallbackCities[0] || 'lucknow');
  }

  return fixed;
}

const HOSPITAL_DIRECTORY = {
  'lucknow': [
    { name: 'King George Medical University', phone: '0522-2257450', lat: 26.8700, lng: 80.9150 },
    { name: 'Sanjay Gandhi Postgraduate Institute', phone: '0522-2494000', lat: 26.7445, lng: 80.9360 },
    { name: 'Balrampur Hospital', phone: '0522-2628204', lat: 26.8555, lng: 80.9472 },
    { name: 'Civil Hospital Lucknow', phone: '0522-2234421', lat: 26.8477, lng: 80.9462 }
  ],
  'gorakhpur': [
    { name: 'BRD Medical College', phone: '0551-2985100', lat: 26.7606, lng: 83.3732 },
    { name: 'District Hospital Gorakhpur', phone: '0551-2200734', lat: 26.7591, lng: 83.3730 },
    { name: 'AIIMS Gorakhpur', phone: '0551-2205501', lat: 26.7310, lng: 83.4320 }
  ],
  'kanpur': [
    { name: 'Lala Lajpat Rai Hospital', phone: '0512-2559510', lat: 26.4724, lng: 80.3240 },
    { name: 'Ursala Hospital', phone: '0512-2308413', lat: 26.4772, lng: 80.3500 },
    { name: 'Regency Hospital Kanpur', phone: '0512-3500444', lat: 26.4499, lng: 80.3319 }
  ],
  'varanasi': [
    { name: 'Sir Sunderlal Hospital BHU', phone: '0542-2367568', lat: 25.2677, lng: 82.9913 },
    { name: 'Heritage Hospital Varanasi', phone: '0542-2500000', lat: 25.3176, lng: 82.9739 }
  ],
  'prayagraj': [
    { name: 'SRN Hospital Prayagraj', phone: '0532-2256507', lat: 25.4358, lng: 81.8463 },
    { name: 'Nazareth Hospital', phone: '0532-2460048', lat: 25.4351, lng: 81.8349 }
  ],
  'agra': [
    { name: 'SN Medical College Agra', phone: '0562-2527411', lat: 27.1767, lng: 78.0081 },
    { name: 'District Hospital Agra', phone: '0562-2260330', lat: 27.1795, lng: 78.0167 }
  ],
  'mumbai': [
    { name: 'KEM Hospital Mumbai', phone: '022-24107000', lat: 19.0026, lng: 72.8416 },
    { name: 'Nair Hospital Mumbai', phone: '022-23027000', lat: 18.9697, lng: 72.8190 }
  ]
};
const INVENTORY_CITY_OPTIONS = Array.from(new Set([
  ...Object.keys(HOSPITAL_DIRECTORY),
  ...Object.values(INDIA_LOCATION_DATA).flat().map(normalizeValue)
])).sort();

function inventoryHospitalOptions(city = '') {
  return HOSPITAL_DIRECTORY[normalizeValue(city)] || [];
}

function syncInventoryCityOptions(selectedCity = '') {
  fillSelectOptions(document.getElementById('inv-city'), INVENTORY_CITY_OPTIONS, 'Select city', selectedCity || 'lucknow');
}

function syncInventoryHospitalOptions(selectedCity = '', selectedHospital = '') {
  const hospitalSelect = document.getElementById('inv-hospital');
  const phoneInput = document.getElementById('inv-phone');
  const latInput = document.getElementById('inv-lat');
  const lngInput = document.getElementById('inv-lng');
  if (!hospitalSelect) return;
  const hospitals = inventoryHospitalOptions(selectedCity);
  if (!hospitals.length) {
    hospitalSelect.innerHTML = '<option value="">No hospital directory available</option>';
    hospitalSelect.disabled = true;
    if (phoneInput) phoneInput.value = '';
    return;
  }

  hospitalSelect.disabled = false;
  hospitalSelect.innerHTML = ['<option value="">Select hospital</option>'].concat(
    hospitals.map((hospital) => {
      const selected = normalizeValue(hospital.name) === normalizeValue(selectedHospital) ? ' selected' : '';
      return `<option value="${hospital.name.replace(/"/g, '&quot;')}"${selected}>${hospital.name}</option>`;
    })
  ).join('');

  const activeHospital = hospitals.find((hospital) => normalizeValue(hospital.name) === normalizeValue(selectedHospital)) || hospitals[0];
  if (!selectedHospital) hospitalSelect.value = activeHospital.name;
  if (phoneInput) phoneInput.value = (activeHospital && activeHospital.phone) || '';
  if (latInput && activeHospital?.lat && !latInput.dataset.manual) latInput.value = activeHospital.lat;
  if (lngInput && activeHospital?.lng && !lngInput.dataset.manual) lngInput.value = activeHospital.lng;
}

function initializeInventoryDirectory(selectedCity = '', selectedHospital = '') {
  const citySelect = document.getElementById('inv-city');
  const hospitalSelect = document.getElementById('inv-hospital');
  const latInput = document.getElementById('inv-lat');
  const lngInput = document.getElementById('inv-lng');
  if (!citySelect || !hospitalSelect) return;

  const initialCity = normalizeValue(selectedCity || citySelect.value || 'lucknow');
  syncInventoryCityOptions(initialCity);
  citySelect.value = initialCity;
  syncInventoryHospitalOptions(initialCity, selectedHospital || hospitalSelect.value || '');

  if (!citySelect.dataset.bound) {
    citySelect.addEventListener('change', () => syncInventoryHospitalOptions(citySelect.value, ''));
    citySelect.dataset.bound = '1';
  }
  if (!hospitalSelect.dataset.bound) {
    hospitalSelect.addEventListener('change', () => syncInventoryHospitalOptions(citySelect?.value || '', hospitalSelect.value));
    hospitalSelect.dataset.bound = '1';
  }
  if (latInput && !latInput.dataset.bound) {
    latInput.addEventListener('input', () => { latInput.dataset.manual = '1'; });
    latInput.dataset.bound = '1';
  }
  if (lngInput && !lngInput.dataset.bound) {
    lngInput.addEventListener('input', () => { lngInput.dataset.manual = '1'; });
    lngInput.dataset.bound = '1';
  }
}

function titleCase(value = '') {
  return String(value)
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeValue(value = '') {
  return String(value).trim().toLowerCase();
}

function fillSelectOptions(selectEl, options, placeholder, selectedValue = '') {
  if (!selectEl) return;
  const normalizedSelected = normalizeValue(selectedValue);
  const items = [];
  if (placeholder) items.push(`<option value="">${placeholder}</option>`);
  items.push(...options.map((item) => {
    const value = normalizeValue(item);
    const label = titleCase(item);
    const selected = value === normalizedSelected ? ' selected' : '';
    return `<option value="${value}"${selected}>${label}</option>`;
  }));
  selectEl.innerHTML = items.join('');
}

function inferStateFromCity(city = '') {
  const normalizedCity = normalizeValue(city);
  if (!normalizedCity) return '';
  for (const [state, cities] of Object.entries(INDIA_LOCATION_DATA)) {
    if (cities.some((item) => normalizeValue(item) === normalizedCity)) return state;
  }
  return '';
}

function syncCityOptions(citySelectId, stateValue = '', selectedCity = '') {
  const citySelect = document.getElementById(citySelectId);
  if (!citySelect) return;
  const normalizedState = normalizeValue(stateValue);
  const cities = INDIA_LOCATION_DATA[normalizedState] || [];
  fillSelectOptions(citySelect, cities, cities.length ? 'Select city' : 'Select state first', selectedCity);
  citySelect.disabled = !cities.length;
}

function initializeLocationFields() {
  const normalizedUser = normalizeUserLocation(currentUser || {});

  const regState = document.getElementById('reg-state');
  const regCity = document.getElementById('reg-city');
  const searchLocation = document.getElementById('search-location');
  const profileState = document.getElementById('profile-state');

  fillSelectOptions(regState, INDIA_STATES, 'Select state', '');
  fillSelectOptions(searchLocation, INDIA_STATES, 'All States', '');
  fillSelectOptions(profileState, INDIA_STATES, 'Select state', normalizedUser.state || '');

  if (regCity) {
    fillSelectOptions(regCity, [], 'Select state first', '');
    regCity.disabled = true;
  }

  if (regState && !regState.dataset.bound) {
    regState.addEventListener('change', () => syncCityOptions('reg-city', regState.value, ''));
    regState.dataset.bound = '1';
  }

  if (profileState) {
    profileState.value = normalizeValue(normalizedUser.state || 'uttar pradesh');
    syncCityOptions('profile-city', profileState.value, normalizedUser.city || '');
  }

  if (profileState && !profileState.dataset.bound) {
    profileState.addEventListener('change', () => syncCityOptions('profile-city', profileState.value, ''));
    profileState.dataset.bound = '1';
  }
}


const apiFetch = async (url, options = {}) => {
  showLoader(true);
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } finally {
    showLoader(false);
  }
};

function showLoader(show) {
  const el = document.getElementById('loader');
  if (!el) return;
  el.classList.toggle('hidden', !show);
  el.classList.toggle('flex', show);
}

function toast(message, type = 'info') {
  const box = document.getElementById('toast');
  document.getElementById('toast-message').textContent = message;
  document.getElementById('toast-icon').textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : '🔔';
  box.classList.remove('translate-y-24', 'opacity-0');
  setTimeout(() => box.classList.add('translate-y-24', 'opacity-0'), 3000);
}

function setSession(nextToken, user) {
  token = nextToken;
  currentUser = normalizeUserLocation(user);
  localStorage.setItem('bb_token', token);
  localStorage.setItem('bb_user', JSON.stringify(currentUser));
  initializeLocationFields();
  updateAuthButtons();
  updateNavbarUser();
}

function clearSession() {
  token = '';
  currentUser = null;
  localStorage.removeItem('bb_token');
  localStorage.removeItem('bb_user');
  updateAuthButtons();
  updateNavbarUser();
}

function updateAuthButtons() {
  document.querySelectorAll('[data-auth-only]').forEach((el) => el.classList.toggle('hidden', !currentUser));
  document.querySelectorAll('[data-guest-only]').forEach((el) => el.classList.toggle('hidden', !!currentUser));
  document.querySelectorAll('[data-admin-nav]').forEach((el) => el.classList.toggle('hidden', !(currentUser && ['admin','manager'].includes(currentUser.role))));
}

function avatarFallback(user) {
  const name = encodeURIComponent(`${user?.firstName || 'User'} ${user?.lastName || ''}`.trim());
  return `https://ui-avatars.com/api/?name=${name}&background=dc2626&color=fff`;
}

function updateNavbarUser() {
  const avatar = document.getElementById('nav-avatar');
  const name = document.getElementById('nav-user-name');
  if (!avatar || !name) return;
  if (currentUser) {
    avatar.src = currentUser.avatar || avatarFallback(currentUser);
    name.textContent = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'My Account';
  } else {
    avatar.src = avatarFallback({ firstName: 'User' });
    name.textContent = 'My Account';
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('nav-user-menu');
  if (!menu) return;
  menu.classList.toggle('hidden');
}

function closeUserMenu() {
  const menu = document.getElementById('nav-user-menu');
  if (menu) menu.classList.add('hidden');
}

function guard(pageId) {
  if (['donor-dashboard', 'profile', 'requests'].includes(pageId) && !currentUser) {
    toast('Please login first', 'error');
    pageId = 'auth';
  }
  if (pageId === 'admin' && (!currentUser || !['admin', 'manager'].includes(currentUser.role))) {
    toast('Admin access required', 'error');
    pageId = currentUser ? 'home' : 'auth';
  }
  return pageId;
}

function showPage(pageId) {
  pageId = guard(pageId);
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);

  if (pageId === 'search') filterBloodResults();
  if (pageId === 'nearby') {};
  if (pageId === 'requests') loadMyRequests();
  if (pageId === 'donor-dashboard') loadDonorDashboard();
  if (pageId === 'profile') loadProfile();
  if (pageId === 'admin') { initializeInventoryDirectory('lucknow', ''); loadAdminDashboard(); }
}

function switchAuthTab(tab) {
  const login = document.getElementById('login-form');
  const register = document.getElementById('register-form');
  const loginTab = document.getElementById('login-tab');
  const regTab = document.getElementById('register-tab');
  if (!login || !register) return;

  if (tab === 'login') {
    login.classList.remove('hidden');
    register.classList.add('hidden');
    login.style.display = 'grid';
    register.style.display = 'none';
    loginTab?.classList.add('bg-white', 'dark:bg-slate-900', 'text-blood-600', 'shadow');
    regTab?.classList.remove('bg-white', 'dark:bg-slate-900', 'text-blood-600', 'shadow');
  } else {
    login.classList.add('hidden');
    register.classList.remove('hidden');
    login.style.display = 'none';
    register.style.display = 'grid';
    regTab?.classList.add('bg-white', 'dark:bg-slate-900', 'text-blood-600', 'shadow');
    loginTab?.classList.remove('bg-white', 'dark:bg-slate-900', 'text-blood-600', 'shadow');
    initializeLocationFields();
  }
}


function openRegister(){ showPage('auth'); switchAuthTab('register'); }
function logout(){ clearSession(); toast('Logged out', 'success'); showPage('home'); }

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('bb_theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

async function captureLocation(runNearby = false, saveProfile = false) {
  if (!navigator.geolocation) return toast('Geolocation not supported', 'error');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    currentLocation = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    localStorage.setItem('bb_location', JSON.stringify(currentLocation));
    toast('Location captured', 'success');
    if (runNearby) searchNearbyDonors();
    if (saveProfile && currentUser) {
      await saveProfile(true);
    }
  }, () => toast('Could not capture location', 'error'), { enableHighAccuracy: true, timeout: 10000 });
}

async function useMyLocationAndSearch(){ await captureLocation(); filterBloodResults(true); }

async function handleRegister(e) {
  e.preventDefault();

  try {
    const payload = {
      firstName: document.getElementById('reg-fname').value.trim(),
      lastName: document.getElementById('reg-lname').value.trim(),
      email: document.getElementById('reg-email').value.trim(),
      phone: document.getElementById('reg-phone').value.trim(),
      bloodGroup: document.getElementById('reg-blood').value,
      role: document.getElementById('reg-role').value,

      city: document.getElementById('reg-city').value,
      state: document.getElementById('reg-state').value,

      address: document.getElementById('reg-address').value.trim(),

      password: document.getElementById('reg-password').value,

      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude
    };

    const data = await apiFetch(
      `${API}/auth/register`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );

    setSession(data.token, data.user);

    toast('Registration successful', 'success');

    showPage(
      data.user.role === 'donor'
        ? 'donor-dashboard'
        : 'profile'
    );

  } catch (err) {
    toast(err.message, 'error');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  try {
    const data = await apiFetch(`${API}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value
      })
    });
    setSession(data.token, data.user);
    toast('Login successful', 'success');
    showPage(data.user.role === 'admin' || data.user.role === 'manager' ? 'admin' : data.user.role === 'donor' ? 'donor-dashboard' : 'requests');
  } catch (err) { toast(err.message, 'error'); }
}

async function startForgotPassword() {
  try {
    const email = document.getElementById('forgot-email').value.trim();
    const data = await apiFetch(`${API}/auth/forgot-password`, { method: 'POST', body: JSON.stringify({ email }) });
    toast(data.resetToken ? `Reset token: ${data.resetToken}` : data.message, 'success');
  } catch (err) { toast(err.message, 'error'); }
}

async function resetPassword() {
  try {
    await apiFetch(`${API}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('forgot-email').value.trim(),
        token: document.getElementById('reset-token').value.trim(),
        newPassword: document.getElementById('reset-password').value
      })
    });
    toast('Password reset successful', 'success');
    showPage('auth');
  } catch (err) { toast(err.message, 'error'); }
}

async function sendEmailVerification() {
  try {
    const user = JSON.parse(localStorage.getItem('bb_user') || '{}');

    if (!user.email) {
      return toast('User email not found', 'error');
    }

    const data = await apiFetch(`${API}/auth/send-email-token`, {
      method: 'POST',
      body: JSON.stringify({ email: user.email })
    });

    document.getElementById('email-token').value = data.emailVerificationToken || '';
    toast(data.message || 'Email token generated', 'success');

  } catch (err) {
    toast(err.message || 'Request failed', 'error');
  }
}

async function sendMobileOtp() {
  try {
    const user = JSON.parse(localStorage.getItem('bb_user') || '{}');

    if (!user.email) {
      return toast('User email not found', 'error');
    }

    const data = await apiFetch(`${API}/auth/send-phone-otp`, {
      method: 'POST',
      body: JSON.stringify({ email: user.email })
    });

    document.getElementById('mobile-otp').value = data.phoneOtp || '';
    toast(data.message || 'OTP generated', 'success');

  } catch (err) {
    toast(err.message || 'Request failed', 'error');
  }
}

async function verifyMobileOtp() {
  try {
    const user = JSON.parse(localStorage.getItem('bb_user') || '{}');
    const otp = document.getElementById('mobile-otp').value.trim();

    if (!user.email) {
      return toast('User email not found', 'error');
    }

    if (!otp) {
      return toast('Enter OTP first', 'error');
    }

    const data = await apiFetch(`${API}/auth/verify-phone-otp`, {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        otp
      })
    });

    if (data.user) {
      localStorage.setItem('bb_user', JSON.stringify(data.user));
    }

    toast(data.message || 'Phone verified', 'success');

  } catch (err) {
    toast(err.message || 'Request failed', 'error');
  }
}

async function verifyEmailToken() {
  try {
    const token = document.getElementById('email-token').value.trim();

    if (!token) {
      return toast('Enter email token first', 'error');
    }

    const data = await apiFetch(`${API}/auth/verify-email`, {
      method: 'POST',
      body: JSON.stringify({ token })
    });

    if (data.user) {
      localStorage.setItem('bb_user', JSON.stringify(data.user));
    }

    toast(data.message || 'Email verified', 'success');

  } catch (err) {
    toast(err.message || 'Request failed', 'error');
  }
}

async function filterBloodResults(useGeo = false) {
  try {
    const q = new URLSearchParams();

    const bloodGroup = document.getElementById('search-blood-group').value;
    const city = document.getElementById('search-location').value;
    const urgency = document.getElementById('search-urgency').value;

    if (bloodGroup) q.append('bloodGroup', bloodGroup);

    if (city) q.append('state', city);

    if (urgency) q.append('urgency', urgency);

    if (useGeo && currentLocation) {
      q.append('lat', currentLocation.latitude);
      q.append('lng', currentLocation.longitude);
      q.append('radius', 100);
    }

    const data = await apiFetch(
      `${API}/inventory/search?${q.toString()}`
    );

    currentBloodResults = data.results || [];

    renderBloodResults();

    renderInventoryMap();

  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderBloodResults() {
  const wrap = document.getElementById('blood-results');
  document.getElementById('results-count').textContent = `${currentBloodResults.length} results found`;
  if (!currentBloodResults.length) {
    wrap.innerHTML = '<div class="rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">No blood units found.</div>';
    return;
  }
  wrap.innerHTML = currentBloodResults.map(item => `
    <div class="rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
      <div class="flex items-start justify-between gap-3">
        <div><div class="text-3xl font-black text-blood-600">${item.bloodGroup}</div><div class="font-bold">${item.hospitalName}</div><div class="text-sm text-slate-500">${item.city}${item.distanceKm ? ` • ${item.distanceKm.toFixed(1)} km away` : ''}</div></div>
        <span class="rounded-full px-3 py-1 text-xs font-bold ${item.urgency === 'emergency' ? 'bg-red-100 text-red-700' : item.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}">${item.urgency}</span>
      </div>
      <div class="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>Units: <b>${item.units}</b></div>
        <div>Phone: <a href="tel:${item.hospitalPhone}" class="text-blood-600 font-semibold">${item.hospitalPhone || 'N/A'}</a></div>
        <div>Expiry: ${new Date(item.expiryDate).toLocaleDateString()}</div>
      </div>
      <div class="mt-4 flex gap-2">
        <button onclick="requestBlood('${item._id}')" class="flex-1 rounded-2xl bg-blood-600 px-4 py-3 font-bold text-white">Request Blood</button>
        <a href="tel:${item.hospitalPhone}" class="rounded-2xl border px-4 py-3 font-bold">Call</a>
      </div>
    </div>`).join('');
}

function renderInventoryMap() {
  const container = document.getElementById('inventory-map');
  if (!container || typeof L === 'undefined') return;

  if (!inventoryMap) {
    inventoryMap = L.map('inventory-map').setView([26.8467, 80.9462], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(inventoryMap);
  }

  inventoryMarkers.forEach(m => inventoryMap.removeLayer(m));
  inventoryMarkers = [];

  const points = Array.isArray(currentBloodResults) && currentBloodResults.length
    ? currentBloodResults
    : [
        {
          location: { coordinates: [80.9462, 26.8467] },
          hospitalName: 'Lucknow'
        }
      ];

  const bounds = [];

  points.forEach(item => {
    let lat, lng;

    if (item?.location?.coordinates && item.location.coordinates.length >= 2) {
      lng = Number(item.location.coordinates[0]);
      lat = Number(item.location.coordinates[1]);
    } else if (item?.coordinates?.lat && item?.coordinates?.lng) {
      lat = Number(item.coordinates.lat);
      lng = Number(item.coordinates.lng);
    } else {
      return;
    }

    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const marker = L.marker([lat, lng]).addTo(inventoryMap).bindPopup(`
      <b>${item.hospitalName || 'Unknown Hospital'}</b><br/>
      ${item.bloodGroup || ''} ${item.units ? `• ${item.units} units` : ''}
    `);

    inventoryMarkers.push(marker);
    bounds.push([lat, lng]);
  });

  if (bounds.length === 1) {
    inventoryMap.setView(bounds[0], 11);
  } else if (bounds.length > 1) {
    inventoryMap.fitBounds(bounds, { padding: [30, 30] });
  } else {
    inventoryMap.setView([26.8467, 80.9462], 5);
  }

  setTimeout(() => {
    inventoryMap.invalidateSize();
  }, 200);
}

async function searchNearbyDonors() {
  try {
    if (!currentLocation) {
      return toast('Capture current location first', 'error');
    }

    const bloodGroup = document.getElementById('nearby-blood-group').value;
    const radius = document.getElementById('nearby-radius').value || 100;

    const data = await apiFetch(
      `${API}/inventory/nearby-donors?bloodGroup=${encodeURIComponent(bloodGroup)}&lat=${currentLocation.latitude}&lng=${currentLocation.longitude}&radius=${radius}`
    );

    const donors = data?.donors || data?.results || [];

    const wrap = document.getElementById('nearby-results');
    if (!wrap) return;

    if (!Array.isArray(donors) || donors.length === 0) {
      wrap.innerHTML = '<div class="rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">No nearby compatible donors found.</div>';
      return;
    }

    wrap.innerHTML = donors.map(d => `
      <div class="rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div class="text-xl font-black text-blood-600">${d.bloodGroup || 'N/A'}</div>
        <div class="font-bold">${d.firstName || ''} ${d.lastName || ''}</div>
        <div class="text-sm text-slate-500">
          ${d.city || 'Unknown city'}${d.state ? `, ${d.state}` : ''}${d.distanceKm ? ` • ${Number(d.distanceKm).toFixed(1)} km away` : ''}
        </div>
        <div class="mt-3 text-sm">
          Status: ${d.isAvailable ? 'Available' : 'Unavailable'} / ${d.isEligible ? 'Eligible' : 'Not eligible'}
        </div>
        <div class="mt-4 flex gap-2">
          <a href="tel:${d.phone || ''}" class="flex-1 rounded-2xl border px-4 py-3 text-center font-bold">Call</a>
          <button onclick="showPage('requests')" class="flex-1 rounded-2xl bg-blood-600 px-4 py-3 font-bold text-white">Open Requests</button>
        </div>
      </div>
    `).join('');

    toast(`${donors.length} nearby donors found`, 'success');
  } catch (err) {
    console.error(err);
    toast(err.message, 'error');
  }
}

async function requestBlood(inventoryId) {
  try {
    if (!currentUser) return showPage('auth');
    const item = currentBloodResults.find(x => x._id === inventoryId);
    if (!item) return;
    await apiFetch(`${API}/requests`, { method: 'POST', body: JSON.stringify({ inventoryId, bloodGroup: item.bloodGroup, unitsNeeded: 1, urgency: item.urgency, hospitalName: item.hospitalName, hospitalPhone: item.hospitalPhone, city: item.city, notes: 'Requested from website' }) });
    toast('Blood request created', 'success');
    loadMyRequests();
  } catch (err) { toast(err.message, 'error'); }
}

async function loadMyRequests() {
  try {
    if (!currentUser) return;
    const data = await apiFetch(`${API}/requests/mine`);
    const wrap = document.getElementById('request-list');
    if (!data.requests.length) {
      wrap.innerHTML = '<div class="rounded-2xl border p-4">No requests found.</div>'; return;
    }
    wrap.innerHTML = data.requests.map(r => `
      <div class="rounded-3xl border p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="text-xl font-black">${r.bloodGroup} • ${r.hospitalName}</div>
            <div class="text-sm text-slate-500">${r.city} • ${r.urgency} • ${new Date(r.createdAt).toLocaleString()}</div>
            <div class="mt-1 text-sm">Status: <span class="font-bold">${r.status}</span></div>
          </div>
          <div class="flex flex-wrap gap-2">
            ${r.status !== 'completed' ? `<button onclick="contactDonor('${r._id}')" class="rounded-2xl border px-4 py-2 font-bold">Contact donor</button>` : ''}
            ${['approved','pending'].includes(r.status) ? `<button onclick="completeRequest('${r._id}')" class="rounded-2xl bg-blood-600 px-4 py-2 font-bold text-white">Mark Completed</button>` : ''}
          </div>
        </div>
      </div>`).join('');
  } catch (err) { toast(err.message, 'error'); }
}

async function contactDonor(id) {
  try {
    const data = await apiFetch(`${API}/requests/${id}/contact-donor`, { method: 'POST' });
    toast(`Donor assigned: ${data.donor.name} (${data.donor.phone})`, 'success');
    loadMyRequests();
  } catch (err) { toast(err.message, 'error'); }
}

async function completeRequest(id) {
  try {
    await apiFetch(`${API}/requests/${id}/complete`, { method: 'POST' });
    toast('Request completed', 'success');
    loadMyRequests();
    if (currentUser?.role === 'donor') loadDonorDashboard();
  } catch (err) { toast(err.message, 'error'); }
}

async function loadDonorDashboard() {
  try {
    if (!currentUser || currentUser.role === 'admin' || currentUser.role === 'manager') return;

    const profileRes = await apiFetch(`${API}/donor/me`);
    const profile = profileRes.user || profileRes;
    const donations = await apiFetch(`${API}/donor/donations`);
    latestDonations = donations.donations || [];

    const notes = await apiFetch(`${API}/notifications`);

    document.getElementById('donor-name').textContent =
      `${profile.firstName} ${profile.lastName}`;

    document.getElementById('donor-subtitle').textContent =
      `Blood group ${profile.bloodGroup || '-'} • ${titleCase(profile.city || '') || 'Unknown city'}`;

    document.getElementById('don-stat-1').textContent = profileRes.totalDonations ?? 0;
    document.getElementById('don-stat-2').textContent = profileRes.totalLivesSaved ?? 0;
    document.getElementById('don-stat-3').textContent = profileRes.lastDonationVolume ?? '0ml';
    document.getElementById('don-stat-4').textContent = profileRes.daysUntilNextEligible ?? '0 days';

    document.getElementById('availability-toggle').checked = !!profile.isAvailable;
    document.getElementById('availability-toggle').disabled = !profile.isEligible;

    document.getElementById('donation-history').innerHTML =
      latestDonations.length
        ? latestDonations.map(d => `
          <div class="rounded-2xl border p-4">
            <div class="font-bold">${d.hospitalName}</div>
            <div class="text-sm text-slate-500">
              ${new Date(d.donatedAt).toLocaleDateString()} • ${d.quantityMl}ml • ${d.bloodGroup}
            </div>
          </div>
        `).join('')
        : '<div class="rounded-2xl border p-4">No donation history yet.</div>';

    document.getElementById('notification-list').innerHTML =
      notes.notifications.length
        ? notes.notifications.map(n => `
          <div class="rounded-2xl border p-4">
            <div class="font-bold">${n.title}</div>
            <div class="text-sm text-slate-500">${n.message}</div>
          </div>
        `).join('')
        : '<div class="rounded-2xl border p-4">No notifications yet.</div>';

  } catch (err) {
    toast(err.message, 'error');
  }
}

async function toggleAvailability(isAvailable) {
  try {
    const data = await apiFetch(`${API}/donor/availability`, { method: 'PATCH', body: JSON.stringify({ isAvailable }) });
    toast(`Availability: ${data.isAvailable ? 'available' : 'unavailable'}`, 'success');
  } catch (err) { toast(err.message, 'error'); }
}

async function downloadMyReceiptPdf() {
  if (!latestDonations.length) return toast('No donation receipt available', 'error');
  const latest = latestDonations[0];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(20); doc.text('BloodBank Donation Receipt', 20, 20);
  doc.setFontSize(12);
  doc.text(`Receipt ID: ${latest.receiptId}`, 20, 40);
  doc.text(`Hospital: ${latest.hospitalName}`, 20, 50);
  doc.text(`Blood Group: ${latest.bloodGroup}`, 20, 60);
  doc.text(`Quantity: ${latest.quantityMl}ml`, 20, 70);
  doc.text(`Date: ${new Date(latest.donatedAt).toLocaleString()}`, 20, 80);
  doc.save(`receipt-${latest.receiptId}.pdf`);
}

async function loadProfile() {
  try {
    if (!currentUser) return;

    const me = await apiFetch(`${API}/auth/me`);
    const u = normalizeUserLocation(me.user || me);

    currentUser = u;
    localStorage.setItem('bb_user', JSON.stringify(u));
    initializeLocationFields();

    document.getElementById('profile-fname').value = u.firstName || '';
    document.getElementById('profile-lname').value = u.lastName || '';
    document.getElementById('profile-phone').value = u.phone || '';
    const inferredState = normalizeValue(u.state || inferStateFromCity(u.city) || 'uttar pradesh');
    document.getElementById('profile-state').value = inferredState;
    syncCityOptions('profile-city', inferredState, u.city || '');
    document.getElementById('profile-city').value = normalizeValue(u.city || '');
    document.getElementById('profile-address').value = u.address || '';
    document.getElementById('profile-bio').value = u.bio || '';
    const avatarInput = document.getElementById('profile-avatar');
    const avatarPreview = document.getElementById('profile-avatar-preview');
    if (avatarInput) avatarInput.value = u.avatar || '';
    if (avatarPreview) avatarPreview.src = u.avatar || avatarFallback(u);
    const fullName = document.getElementById('profile-full-name');
    const bloodBadge = document.getElementById('profile-blood-badge');
    const cityBadge = document.getElementById('profile-city-badge');
    if (fullName) fullName.textContent = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'My Profile';
    if (bloodBadge) bloodBadge.textContent = u.bloodGroup || 'Blood Group';
    if (cityBadge) cityBadge.textContent = titleCase(u.city || 'City');
    updateNavbarUser();

  } catch (err) {
    toast(err.message, 'error');
  }
}

async function saveProfile(withLocation = false) {
  try {
    const payload = {
      firstName: document.getElementById('profile-fname').value.trim(),
      lastName: document.getElementById('profile-lname').value.trim(),
      phone: document.getElementById('profile-phone').value.trim(),
      city: document.getElementById('profile-city').value,
      state: document.getElementById('profile-state').value,
      address: document.getElementById('profile-address').value.trim(),
      bio: document.getElementById('profile-bio').value.trim(),
      avatar: document.getElementById('profile-avatar')?.value.trim() || '',
    };

    if (withLocation && currentLocation) {
      payload.latitude = currentLocation.latitude;
      payload.longitude = currentLocation.longitude;
    }

    const data = await apiFetch(`${API}/auth/profile`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    currentUser = normalizeUserLocation(data.user || data);
    localStorage.setItem('bb_user', JSON.stringify(currentUser));
    updateNavbarUser();
    loadProfile();
    toast('Profile updated', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function loadAdminDashboard() {
  try {
    const [stats, users, requests, inventory, contacts] = await Promise.all([
      apiFetch(`${API}/admin/stats`),
      apiFetch(`${API}/admin/users`),
      apiFetch(`${API}/admin/requests`),
      apiFetch(`${API}/admin/inventory`),
      apiFetch(`${API}/admin/contact-messages`)
    ]);
    document.getElementById('admin-stat-1').textContent = stats.totalUsers;
    document.getElementById('admin-stat-2').textContent = stats.totalDonors;
    document.getElementById('admin-stat-3').textContent = stats.pendingRequests;
    document.getElementById('admin-stat-4').textContent = stats.totalUnits;

    renderCharts(stats);
    renderAdminInventory(inventory.inventory);
    renderAdminContacts(contacts.messages || []);
    renderAdminRequests(requests.requests);
    renderAdminUsers(users.users);
  } catch (err) { toast(err.message, 'error'); }
}

function renderCharts(stats) {
  if (bloodChart) bloodChart.destroy();
  if (donationChart) donationChart.destroy();
  bloodChart = new Chart(document.getElementById('blood-chart'), {
    type: 'bar',
    data: {
      labels: stats.bloodGroupStats.map(x => x._id),
      datasets: [{ label: 'Units', data: stats.bloodGroupStats.map(x => x.units) }]
    }
  });
  donationChart = new Chart(document.getElementById('donation-chart'), {
    type: 'line',
    data: {
      labels: stats.monthlyDonations.map(x => `M${x._id}`),
      datasets: [{ label: 'Donations', data: stats.monthlyDonations.map(x => x.count) }]
    }
  });
}

function renderAdminInventory(items) {
  adminInventory = items;
  const wrap = document.getElementById('admin-inventory-list');
  wrap.innerHTML = items.map(item => `
    <div class="rounded-2xl border p-4">
      <div class="flex items-center justify-between gap-2"><div><div class="text-2xl font-black text-blood-600">${item.bloodGroup}</div><div class="font-bold">${item.hospitalName}</div><div class="text-sm text-slate-500">${item.city}</div></div><span class="text-sm font-bold">${item.units} units</span></div>
      <div class="mt-3 grid gap-2 text-sm"><div>Phone: ${item.hospitalPhone || '-'}</div><div>Expiry: ${new Date(item.expiryDate).toLocaleDateString()}</div></div>
      <div class="mt-4 flex gap-2"><button onclick="prefillInventoryById('${item._id}')" class="flex-1 rounded-2xl border px-4 py-2 font-bold">Edit</button><button onclick="deleteInventory('${item._id}')" class="flex-1 rounded-2xl bg-red-600 px-4 py-2 font-bold text-white">Delete</button></div>
    </div>`).join('');
}

function prefillInventoryById(id) {
  const item = adminInventory.find(x => x._id === id);
  if (!item) return;
  document.getElementById('inv-blood').value = item.bloodGroup;
  document.getElementById('inv-units').value = item.units;
  initializeInventoryDirectory(item.city, item.hospitalName);
  document.getElementById('inv-city').value = normalizeValue(item.city);
  document.getElementById('inv-hospital').value = item.hospitalName;
  document.getElementById('inv-phone').value = item.hospitalPhone || '';
  document.getElementById('inv-urgency').value = item.urgency;
  document.getElementById('inv-expiry').value = new Date(item.expiryDate).toISOString().slice(0,10);
  document.getElementById('inv-lat').value = item.coordinates.lat;
  document.getElementById('inv-lng').value = item.coordinates.lng;
  document.getElementById('inv-hospital').dataset.editId = item._id;
}

async function saveInventory() {
  try {
    const hospitalInput = document.getElementById('inv-hospital');
    const editId = hospitalInput.dataset.editId || '';
    const selectedCity = document.getElementById('inv-city').value.trim().toLowerCase();
    const selectedHospital = inventoryHospitalOptions(selectedCity).find((item) => item.name === hospitalInput.value.trim());

    const lat = Number(document.getElementById('inv-lat').value) || selectedHospital?.lat || 26.8467;
    const lng = Number(document.getElementById('inv-lng').value) || selectedHospital?.lng || 80.9462;

    const payload = {
      bloodGroup: document.getElementById('inv-blood').value,
      units: Number(document.getElementById('inv-units').value),
      city: selectedCity,
      state: inferStateFromCity(selectedCity) || 'uttar pradesh',
      hospitalName: hospitalInput.value.trim(),
      hospitalPhone: document.getElementById('inv-phone').value.trim() || selectedHospital?.phone || '',
      urgency: document.getElementById('inv-urgency').value,
      expiryDate: document.getElementById('inv-expiry').value,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      }
    };

    if (editId) {
      await apiFetch(`${API}/inventory/${editId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      toast('Inventory updated', 'success');
    } else {
      await apiFetch(`${API}/inventory`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      toast('Inventory added', 'success');
    }

    document.getElementById('inv-blood').value = 'A+';
    document.getElementById('inv-units').value = '';
    initializeInventoryDirectory('lucknow', '');
    document.getElementById('inv-urgency').value = 'normal';
    document.getElementById('inv-expiry').value = '';
    document.getElementById('inv-lat').value = '';
    document.getElementById('inv-lng').value = '';
    document.getElementById('inv-hospital').dataset.editId = '';

    loadAdminDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}


function editInventory(
  id,
  bloodGroup,
  units,
  city,
  hospitalName,
  hospitalPhone,
  urgency,
  expiryDate,
  lat,
  lng
) {
  document.getElementById('inv-blood').value = bloodGroup || 'A+';
  document.getElementById('inv-units').value = units || '';
  initializeInventoryDirectory(city || 'lucknow', hospitalName || '');
  document.getElementById('inv-city').value = normalizeValue(city || 'lucknow');
  document.getElementById('inv-hospital').value = hospitalName || '';
  document.getElementById('inv-phone').value = hospitalPhone || '';
  document.getElementById('inv-urgency').value = urgency || 'normal';
  document.getElementById('inv-expiry').value = expiryDate ? String(expiryDate).slice(0, 10) : '';
  document.getElementById('inv-lat').value = lat ?? '';
  document.getElementById('inv-lng').value = lng ?? '';
  document.getElementById('inv-hospital').dataset.editId = id || '';

  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast('Inventory loaded for editing', 'success');
}


async function deleteInventory(id) { try { await apiFetch(`${API}/inventory/${id}`, { method: 'DELETE' }); toast('Inventory deleted', 'success'); loadAdminDashboard(); } catch (err) { toast(err.message, 'error'); } }
async function cleanupExpiredInventory(){ try { const data = await apiFetch(`${API}/admin/inventory/expired/cleanup`, { method: 'DELETE' }); toast(`${data.deletedCount} expired items removed`, 'success'); loadAdminDashboard(); } catch (err) { toast(err.message, 'error'); } }

async function updateContactMessageStatus(id, status) {
  try {
    await apiFetch(`${API}/admin/contact-messages/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    toast('Contact message updated', 'success');
    loadAdminDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderAdminContacts(messages) {
  const wrap = document.getElementById('admin-contact-list');
  if (!wrap) return;
  wrap.innerHTML = messages.length ? messages.map((item) => `
    <div class="rounded-2xl border p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="font-black">${item.subject || 'General enquiry'}</div>
          <div class="text-sm text-slate-500">${item.name} • ${item.email}${item.phone ? ` • ${item.phone}` : ''}</div>
          <div class="mt-2 text-sm">${item.message}</div>
        </div>
        <div class="flex items-center gap-2">
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase dark:bg-slate-800">${item.status}</span>
          <button onclick="updateContactMessageStatus('${item._id}','reviewed')" class="rounded-2xl border px-3 py-2 text-sm font-bold">Mark reviewed</button>
        </div>
      </div>
    </div>`).join('') : '<div class="rounded-2xl border p-4 text-sm">No contact messages yet.</div>';
}

function renderAdminRequests(items) {
  const wrap = document.getElementById('admin-requests-list');
  wrap.innerHTML = items.map(item => `
    <div class="rounded-2xl border p-4">
      <div class="flex flex-wrap items-start justify-between gap-3"><div><div class="text-xl font-black">${item.bloodGroup} • ${item.hospitalName}</div><div class="text-sm text-slate-500">${item.requesterName} • ${item.city} • ${item.urgency}</div><div class="text-sm">Status: <b>${item.status}</b></div></div><div class="flex flex-wrap gap-2"><button onclick="adminUpdateRequest('${item._id}','approved')" class="rounded-2xl border px-4 py-2 font-bold">Approve</button><button onclick="adminUpdateRequest('${item._id}','rejected')" class="rounded-2xl border px-4 py-2 font-bold">Reject</button><button onclick="adminUpdateRequest('${item._id}','completed')" class="rounded-2xl bg-blood-600 px-4 py-2 font-bold text-white">Complete</button></div></div>
    </div>`).join('');
}

async function adminUpdateRequest(id, status) { try { await apiFetch(`${API}/admin/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); toast(`Request ${status}`, 'success'); loadAdminDashboard(); } catch (err) { toast(err.message, 'error'); } }

function renderAdminUsers(users) {
  const wrap = document.getElementById('admin-users-list');
  wrap.innerHTML = users.map(u => `
    <div class="rounded-2xl border p-4">
      <div class="flex flex-wrap items-start justify-between gap-3"><div><div class="font-black">${u.firstName} ${u.lastName}</div><div class="text-sm text-slate-500">${u.email} • ${u.role} • ${u.city}</div><div class="text-sm">Blocked: ${u.isBlocked ? 'Yes' : 'No'}</div></div><div class="flex gap-2"><button onclick="toggleBlock('${u._id}')" class="rounded-2xl border px-4 py-2 font-bold">${u.isBlocked ? 'Unblock' : 'Block'}</button><button onclick="deleteUser('${u._id}')" class="rounded-2xl bg-red-600 px-4 py-2 font-bold text-white">Delete</button></div></div>
    </div>`).join('');
}

async function toggleBlock(id){ try { await apiFetch(`${API}/admin/users/${id}/block`, { method: 'PATCH' }); toast('User status changed', 'success'); loadAdminDashboard(); } catch (err) { toast(err.message, 'error'); } }
async function deleteUser(id){ try { await apiFetch(`${API}/admin/users/${id}`, { method: 'DELETE' }); toast('User deleted', 'success'); loadAdminDashboard(); } catch (err) { toast(err.message, 'error'); } }

async function loadHomeStats() {
  try {
    const stats = await apiFetch(`${API}/public/summary`);
    document.getElementById('stat-donors').textContent = stats.activeDonors;
    document.getElementById('stat-pending').textContent = stats.pendingRequests;
    document.getElementById('stat-units').textContent = stats.totalUnits;
    document.getElementById('home-alerts').innerHTML = stats.recentRequests.map(r => `<div class=\"rounded-2xl border p-4\"><div class=\"font-bold\">${r.bloodGroup} needed</div><div class=\"text-sm text-slate-500\">${r.hospitalName} • ${r.urgency}</div></div>`).join('') || '<div class=\"rounded-2xl border p-4 text-sm\">No recent alerts.</div>';
  } catch {
    document.getElementById('home-alerts').innerHTML = '<div class="rounded-2xl border p-4 text-sm">Could not load live summary.</div>';
  }
}

async function submitContact() {
  try {
    const payload = {
      name: document.getElementById('contact-name').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      phone: document.getElementById('contact-phone').value.trim(),
      subject: document.getElementById('contact-subject').value.trim() || 'General enquiry',
      message: document.getElementById('contact-message').value.trim()
    };
    await apiFetch(`${API}/public/contact`, { method: 'POST', body: JSON.stringify(payload) });
    toast('Message sent successfully', 'success');
    ['contact-name','contact-email','contact-phone','contact-subject','contact-message'].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
  } catch (err) {
    toast(err.message, 'error');
  }
}

function bindFeatureCards() {
  document.querySelectorAll('.feature-card').forEach(card => card.addEventListener('click', () => showPage(card.dataset.action)));
}

window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('bb_theme') === 'dark') document.documentElement.classList.add('dark');
  updateAuthButtons();
  updateNavbarUser();
  bindFeatureCards();
  initializeLocationFields();
  initializeInventoryDirectory();
  loadHomeStats();
  filterBloodResults();

  document.addEventListener('click', (e) => {
    const menu = document.getElementById('nav-user-menu');
    const trigger = document.getElementById('nav-user-trigger');
    if (!menu || !trigger) return;
    if (!menu.contains(e.target) && !trigger.contains(e.target)) closeUserMenu();
  });

  const avatarInput = document.getElementById('profile-avatar');
  const avatarPreview = document.getElementById('profile-avatar-preview');
  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener('input', () => {
      avatarPreview.src = avatarInput.value.trim() || avatarFallback(currentUser || { firstName: 'User' });
    });
  }

  if (currentUser) {
    if (['admin', 'manager'].includes(currentUser.role)) showPage('admin');
    else if (currentUser.role === 'donor') loadDonorDashboard();
    else loadProfile();
  }
});
