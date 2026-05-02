// Theme Switcher Verification Script
// Copy and paste this into your browser console to test the theme switcher

console.log('%c🌙 Theme Switcher Status Check', 'font-size: 16px; font-weight: bold; color: #DC2626');

// 1. Check if files exist
console.log('\n1️⃣ Checking Setup...');
const themeContext = document.querySelector('[data-testid="theme-context"]');
const themeToggle = document.querySelector('.theme-toggle');

if (themeToggle) {
    console.log('✅ ThemeToggle component found in DOM');
} else {
    console.warn('⚠️ ThemeToggle component NOT found in DOM');
    console.log('   Expected selector: .theme-toggle');
}

// 2. Check localStorage
console.log('\n2️⃣ Checking LocalStorage...');
const savedTheme = localStorage.getItem('theme');
console.log(`   Saved theme: ${savedTheme ? `"${savedTheme}"` : 'NOT SET'}`);

// 3. Check HTML attribute
console.log('\n3️⃣ Checking HTML Attributes...');
const htmlTheme = document.documentElement.getAttribute('data-theme');
const bodyClasses = document.body.className;
console.log(`   data-theme attribute: ${htmlTheme ? `"${htmlTheme}"` : 'NOT SET'}`);
console.log(`   Body classes: ${bodyClasses || 'NONE'}`);

// 4. Check CSS Variables
console.log('\n4️⃣ Checking CSS Variables...');
const styles = getComputedStyle(document.documentElement);
const primaryColor = styles.getPropertyValue('--primary-color').trim();
const bgPrimary = styles.getPropertyValue('--bg-primary').trim();
const textPrimary = styles.getPropertyValue('--text-primary').trim();

console.log(`   --primary-color: ${primaryColor}`);
console.log(`   --bg-primary: ${bgPrimary}`);
console.log(`   --text-primary: ${textPrimary}`);

// 5. Summary
console.log('\n5️⃣ Summary...');
const isDarkMode = htmlTheme === 'dark';
const hasToggle = !!themeToggle;
const hasStorage = !!savedTheme;
const hasVariables = primaryColor && bgPrimary && textPrimary;

if (hasToggle && hasVariables) {
    console.log('✅ Theme Switcher is WORKING');
    console.log(`   Current Mode: ${isDarkMode ? '🌙 DARK' : '☀️ LIGHT'}`);
} else {
    console.warn('⚠️ Theme Switcher may have issues:');
    if (!hasToggle) console.warn('   - Toggle button not found');
    if (!hasVariables) console.warn('   - CSS variables not loaded');
}

// 6. Test the toggle
console.log('\n6️⃣ How to Test...');
console.log('   1. Find the button in top-right navbar');
console.log('   2. Button shows: ☀️ Light or 🌙 Dark');
console.log('   3. Click it');
console.log('   4. Colors should change instantly');
console.log('   5. Run this script again to verify');

// 7. Manual test function
window.testThemeToggle = function() {
    const button = document.querySelector('.theme-toggle');
    if (!button) {
        console.error('❌ Theme toggle button not found');
        return;
    }
    
    console.log('\n🧪 Simulating click...');
    const beforeTheme = document.documentElement.getAttribute('data-theme');
    button.click();
    
    setTimeout(() => {
        const afterTheme = document.documentElement.getAttribute('data-theme');
        if (beforeTheme !== afterTheme) {
            console.log(`✅ Theme changed: ${beforeTheme} → ${afterTheme}`);
        } else {
            console.warn('⚠️ Theme did not change after click');
        }
    }, 100);
};

console.log('\n💡 Bonus Commands:');
console.log('   testThemeToggle() - Simulate clicking the toggle');
console.log('   localStorage.getItem("theme") - Check saved theme');
console.log('   document.documentElement.getAttribute("data-theme") - Check current theme');
console.log('   localStorage.clear() - Reset theme to system preference');
console.log('   location.reload() - Reload the page');
