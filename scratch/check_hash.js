const bcrypt = require('bcryptjs');
const hash = '$2b$10$SNL7LhThpClAac10IkQD1.a507f6la0RNG3vLcvzL3mpjWV7rbL9m';
const password = 'admin123';

bcrypt.compare(password, hash).then(res => {
    console.log('Match:', res);
});
