const fs = require('fs').promises;
const path = require('path');

const CUSTOMER_DATA_FILES = [
    path.resolve(__dirname, '../../../backenddata/imported-customers.json'),
    path.resolve(__dirname, '../../../backenddata/imported-customers.csv'),
    path.resolve(__dirname, '../../data/imported-customers.json'),
    path.resolve(__dirname, '../../data/imported-customers.csv')
];

const normalizeMobileNumber = (rawValue = '') => {
    const digits = String(rawValue).replace(/\D/g, '');
    if (!digits) {
        return {
            input: String(rawValue || ''),
            digits: '',
            e164: '',
            national: ''
        };
    }

    if (digits.length === 10) {
        return {
            input: String(rawValue),
            digits: `91${digits}`,
            e164: `+91${digits}`,
            national: digits
        };
    }

    if (digits.length > 10) {
        return {
            input: String(rawValue),
            digits,
            e164: `+${digits}`,
            national: digits.slice(-10)
        };
    }

    return {
        input: String(rawValue),
        digits,
        e164: '',
        national: digits
    };
};

const getLookupVariants = (rawValue = '') => {
    const normalized = normalizeMobileNumber(rawValue);
    return Array.from(new Set([
        normalized.input,
        normalized.digits,
        normalized.e164,
        normalized.national
    ].filter(Boolean)));
};

const parseCsvLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            current += '"';
            index += 1;
            continue;
        }

        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
            continue;
        }

        current += char;
    }

    values.push(current.trim());
    return values;
};

const parseCsv = (content) => {
    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        return [];
    }

    const headers = parseCsvLine(lines[0]).map((header) => header.trim());
    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        return headers.reduce((record, header, index) => {
            record[header] = values[index] || '';
            return record;
        }, {});
    });
};

const toCustomerDetails = (record = {}) => ({
    id: String(record.id || record.customerId || record._id || ''),
    name: String(record.name || record.fullName || record.customerName || 'Imported customer'),
    email: String(record.email || record.customerEmail || ''),
    username: String(record.username || record.customerCode || record.accountCode || ''),
    photo: String(record.photo || record.avatar || ''),
    mobile: String(record.mobile || record.phone || record.phoneNumber || ''),
    lastIp: String(record.lastIp || ''),
    lastLogin: record.lastLogin || null,
    role: String(record.role || 'customer'),
    company: String(record.company || record.organization || ''),
    status: String(record.status || ''),
    address: String(record.address || record.city || record.location || ''),
    source: String(record.source || 'imported-customers')
});

async function loadImportedCustomerRecords() {
    for (const filePath of CUSTOMER_DATA_FILES) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            if (filePath.endsWith('.json')) {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) return parsed;
                if (Array.isArray(parsed.customers)) return parsed.customers;
            }

            if (filePath.endsWith('.csv')) {
                return parseCsv(content);
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Failed to load imported customers from ${filePath}:`, error.message);
            }
        }
    }

    return [];
}

async function findImportedCustomerByMobile(rawMobile) {
    const variants = getLookupVariants(rawMobile);
    if (!variants.length) {
        return null;
    }

    const records = await loadImportedCustomerRecords();
    const match = records.find((record) => {
        const mobileValue = record.mobile || record.phone || record.phoneNumber;
        const recordVariants = getLookupVariants(mobileValue);
        return recordVariants.some((value) => variants.includes(value));
    });

    if (!match) {
        return null;
    }

    return toCustomerDetails(match);
}

module.exports = {
    findImportedCustomerByMobile,
    loadImportedCustomerRecords
};
