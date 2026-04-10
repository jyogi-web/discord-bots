import { InMemoryAdapter } from './in-memory.js';
import { runStorageContractTests } from './storage-contract-tests.js';

runStorageContractTests('InMemoryAdapter', () => new InMemoryAdapter());
