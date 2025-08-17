import 'dotenv/config';

// mocked database instance for testing
const mockDb = {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        transaction: jest.fn()
};

// Mock the db
jest.mock('../db.js', () => mockDb);

export { mockDb };

export const mockSuccess = () => {
    jest.clearAllMocks();
    
    mockDb.transaction.mockImplementation(async (callback) => {
        const mockTrx = {
            insert: jest.fn().mockReturnValue({
                values: jest.fn().mockImplementation((rows) => ({
                    onConflictDoNothing: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue(rows.map((_, i) => ({ id: i + 1 })))
                    })
                }))
            }),
            delete: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([{ id: 1, value: 'test', type: 'ip', mode: 'blacklist', active: true }])
                })
            }),
            update: jest.fn().mockReturnValue({
                set: jest.fn().mockReturnValue({
                    where: jest.fn().mockImplementation((whereCondition) => ({
                        returning: jest.fn().mockResolvedValue([{ id: 1, value: 'test', active: false }])
                    }))
                })
            })
        };
        await callback(mockTrx);
        return undefined;
    });
    
    mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([])
    });
};

export const withData = (data: any[] = []) => {
        jest.clearAllMocks();
    
    mockDb.transaction.mockImplementation(async (callback) => {
        const mockTrx = {
            insert: jest.fn().mockReturnValue({
                values: jest.fn().mockImplementation((rows) => ({
                    onConflictDoNothing: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue(rows.map((_, i) => ({ id: data.length + i + 1 })))
                    })
                }))
            }),
            delete: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue(data.map((item, i) => ({ id: i + 1, value: item.value || 'test', type: item.type || 'ip', mode: item.mode || 'blacklist', active: item.active !== undefined ? item.active : true })))
                })
            }),
            update: jest.fn().mockReturnValue({
                set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([{ id: 1, value: 'test', active: false }])
                    })
                })
            })
        };
        await callback(mockTrx);
        return undefined;
    });
    
    mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(data)
    });
};

export const mockConflict = () => {
        jest.clearAllMocks();
    
    mockDb.transaction.mockImplementation(async (callback) => {
        const mockTrx = {
            insert: jest.fn().mockReturnValue({
                values: jest.fn().mockReturnValue({
                    onConflictDoNothing: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([])
                    })
                })
            }),
            delete: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([])
                })
            }),
            update: jest.fn().mockReturnValue({
                set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([])
                    })
                })
            })
        };
        await callback(mockTrx);
        return undefined;
    });
};
