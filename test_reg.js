async function testRegistration() {
    try {
        const res = await fetch('http://localhost:3000/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `testuser_${Date.now()}`,
                password: 'password123',
                role: 'ADMIN',
                credits: 0
            })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', data);
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

testRegistration();
