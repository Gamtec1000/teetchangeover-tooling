import React, { useState, useEffect } from 'react';
import { 
    getConsumables, 
    addConsumable, 
    updateConsumable, 
    deleteConsumable, 
    getConsumableLogs, 
    consumeItem, 
    uploadFile,
    getPipeSizes
} from '../lib/supabase-service';
import MachineSelection from './MachineSelection';
import { formatImageUrl } from '../utils/urlHelpers';
import { FiPlus, FiEdit, FiTrash2, FiMinus, FiBox, FiClock, FiArrowLeft } from 'react-icons/fi';
import './ConsumablesManagement.css'; // We will create this css file next

interface ConsumableItem {
    id: string;
    machineId: string;
    name: string;
    partCode: string;
    stock: number;
    imageUrl?: string;
}

interface ConsumableLog {
    id: string;
    machineId: string;
    itemId: string;
    itemName: string;
    partCode: string;
    quantityUsed: number;
    pipeSize: string;
    timestamp: any;
}

interface PipeSize {
    id: string;
    name: string;
}

interface Props {
    isAdmin: boolean;
}

const ConsumablesManagement: React.FC<Props> = ({ isAdmin }) => {
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [consumables, setConsumables] = useState<ConsumableItem[]>([]);
    const [logs, setLogs] = useState<ConsumableLog[]>([]);
    const [pipeSizes, setPipeSizes] = useState<PipeSize[]>([]);
    const [view, setView] = useState<'items' | 'logs'>('items');
    const [loading, setLoading] = useState(false);

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ConsumableItem | null>(null);
    const [showConsumeModal, setShowConsumeModal] = useState(false);
    const [consumingItem, setConsumingItem] = useState<ConsumableItem | null>(null);

    // Form States
    const [newItemName, setNewItemName] = useState('');
    const [newItemCode, setNewItemCode] = useState('');
    const [newItemStock, setNewItemStock] = useState(0);
    const [newItemImage, setNewItemImage] = useState<File | null>(null);
    const [selectedPipeSize, setSelectedPipeSize] = useState('');

    useEffect(() => {
        const loadPipeSizes = async () => {
            const sizes = await getPipeSizes();
            // Sort pipe sizes numerically/alphabetically if needed
            setPipeSizes(sizes.map((s: any) => ({ id: s.id, name: s.name })));
        };
        loadPipeSizes();
    }, []);

    useEffect(() => {
        if (selectedMachineId) {
            loadData();
        }
    }, [selectedMachineId]);

    const loadData = async () => {
        if (!selectedMachineId) return;
        setLoading(true);
        try {
            const items = await getConsumables(selectedMachineId);
            setConsumables(items as ConsumableItem[]);
            const logData = await getConsumableLogs(selectedMachineId);
            // Sort logs desc
            logData.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            setLogs(logData as ConsumableLog[]);
        } catch (error) {
            console.error("Error loading consumables data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMachineSelect = (id: string) => {
        setSelectedMachineId(id);
        setView('items');
    };

    const handleAddOrUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMachineId) return;

        try {
            let imageUrl = editingItem?.imageUrl;

            if (newItemImage) {
                imageUrl = await uploadFile(newItemImage);
            }

            const itemData = {
                machineId: selectedMachineId,
                name: newItemName,
                partCode: newItemCode,
                stock: Number(newItemStock),
                imageUrl: imageUrl || ''
            };

            if (editingItem) {
                await updateConsumable(editingItem.id, itemData);
            } else {
                await addConsumable(itemData);
            }

            closeModals();
            loadData();
        } catch (error) {
            console.error("Error saving item:", error);
            alert("Failed to save item.");
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            await deleteConsumable(id);
            loadData();
        }
    };

    const openAddModal = () => {
        setEditingItem(null);
        setNewItemName('');
        setNewItemCode('');
        setNewItemStock(0);
        setNewItemImage(null);
        setShowAddModal(true);
    };

    const openEditModal = (item: ConsumableItem) => {
        setEditingItem(item);
        setNewItemName(item.name);
        setNewItemCode(item.partCode);
        setNewItemStock(item.stock);
        setNewItemImage(null);
        setShowAddModal(true);
    };

    const openConsumeModal = (item: ConsumableItem) => {
        setConsumingItem(item);
        setSelectedPipeSize('');
        setShowConsumeModal(true);
    };

    const handleConsume = async () => {
        if (!consumingItem || !selectedPipeSize) {
            alert("Please select a pipe size.");
            return;
        }

        try {
            const logData = {
                machineId: consumingItem.machineId,
                itemName: consumingItem.name,
                partCode: consumingItem.partCode,
                pipeSize: selectedPipeSize,
                // timestamp added by server/firebase function
            };

            await consumeItem(consumingItem.id, 1, logData);
            
            closeModals();
            loadData(); // Refresh stock and logs
        } catch (error) {
            console.error("Error consuming item:", error);
            alert("Failed to record consumption.");
        }
    };

    const closeModals = () => {
        setShowAddModal(false);
        setShowConsumeModal(false);
        setEditingItem(null);
        setConsumingItem(null);
        setNewItemImage(null);
    };

    if (!selectedMachineId) {
        return <MachineSelection onMachineSelect={handleMachineSelect} />;
    }

    return (
        <div className="consumables-management">
            <div className="header-actions">
                <button className="back-btn" onClick={() => setSelectedMachineId(null)}>
                    <FiArrowLeft /> Back to Machines
                </button>
                <div className="view-toggle">
                    <button 
                        className={view === 'items' ? 'active' : ''} 
                        onClick={() => setView('items')}
                    >
                        <FiBox /> Items
                    </button>
                    <button 
                        className={view === 'logs' ? 'active' : ''} 
                        onClick={() => setView('logs')}
                    >
                        <FiClock /> Logs
                    </button>
                </div>
                {isAdmin && view === 'items' && (
                    <button className="add-btn" onClick={openAddModal}>
                        <FiPlus /> Add Item
                    </button>
                )}
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : view === 'items' ? (
                <div className="items-grid">
                    {consumables.map(item => (
                        <div key={item.id} className="item-card">
                            <div className="item-image">
                                {item.imageUrl ? (
                                    <img src={formatImageUrl(item.imageUrl)} alt={item.name} />
                                ) : (
                                    <div className="placeholder">No Image</div>
                                )}
                            </div>
                            <div className="item-details">
                                <h3>{item.name}</h3>
                                <p className="code">Code: {item.partCode}</p>
                                <p className={`stock ${item.stock < 5 ? 'low' : ''}`}>
                                    Stock: <strong>{item.stock}</strong>
                                </p>
                            </div>
                            <div className="item-actions">
                                {isAdmin ? (
                                    <>
                                        <button onClick={() => openEditModal(item)}><FiEdit /></button>
                                        <button className="delete" onClick={() => handleDeleteItem(item.id)}><FiTrash2 /></button>
                                    </>
                                ) : (
                                    <button 
                                        className="consume-btn" 
                                        onClick={() => openConsumeModal(item)}
                                        disabled={item.stock <= 0}
                                    >
                                        <FiMinus /> Use Item
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {consumables.length === 0 && <p className="no-data">No consumable items found for this machine.</p>}
                </div>
            ) : (
                <div className="logs-view">
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Item</th>
                                <th>Part Code</th>
                                <th>Pipe Size</th>
                                <th>Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td>{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Pending'}</td>
                                    <td>{log.itemName}</td>
                                    <td>{log.partCode}</td>
                                    <td>{log.pipeSize}</td>
                                    <td>{log.quantityUsed}</td>
                                </tr>
                            ))}
                             {logs.length === 0 && <tr><td colSpan={5}>No logs found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingItem ? 'Edit Item' : 'Add New Consumable'}</h3>
                        <form onSubmit={handleAddOrUpdateItem}>
                            <div className="form-group">
                                <label>Item Name:</label>
                                <input 
                                    type="text" 
                                    value={newItemName} 
                                    onChange={e => setNewItemName(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Part Code:</label>
                                <input 
                                    type="text" 
                                    value={newItemCode} 
                                    onChange={e => setNewItemCode(e.target.value)} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Current Stock:</label>
                                <input 
                                    type="number" 
                                    value={newItemStock} 
                                    onChange={e => setNewItemStock(Number(e.target.value))} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Image:</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={e => e.target.files && setNewItemImage(e.target.files[0])} 
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={closeModals}>Cancel</button>
                                <button type="submit" className="primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Consume Modal */}
            {showConsumeModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Use Item: {consumingItem?.name}</h3>
                        <p>Select the Pipe Size for this usage log:</p>
                        <div className="size-selection-grid">
                            {pipeSizes.map(size => (
                                <button 
                                    key={size.id}
                                    type="button"
                                    className={`size-btn ${selectedPipeSize === size.name ? 'selected' : ''}`}
                                    onClick={() => setSelectedPipeSize(size.name)}
                                >
                                    {size.name}
                                </button>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={closeModals}>Cancel</button>
                            <button 
                                type="button" 
                                className="primary" 
                                onClick={handleConsume}
                                disabled={!selectedPipeSize}
                            >
                                Confirm Usage
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsumablesManagement;
