import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { getTranslation, getSubstringsDict, apiSim } from '@wakhar/shared';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Intake from './pages/Intake';
import Inventory from './pages/Inventory';
import Dispatch from './pages/Dispatch';
import Grading from './pages/Grading';
import Receipts from './pages/Receipts';
import Market from './pages/Market';
import Transfers from './pages/Transfers';
import StockCount from './pages/StockCount';
import FarmerPortal from './pages/FarmerPortal';
import AggregatorView from './pages/AggregatorView';
import Warehouses from './pages/Warehouses';
import Reports from './pages/Reports';
import Integrations from './pages/Integrations';
import RBAC from './pages/RBAC';
import { useAuth } from './hooks/useAuth';
import apiClient from './services/apiClient';
import inventoryService from './services/inventoryService';
import dispatchService from './services/dispatchService';
import dashboardService from './services/dashboardService';
import commodityService from './services/commodityService';
import warehouseService from './services/warehouseService';
import farmerService from './services/farmerService';
import fpoService from './services/fpoService';
import qualityService from './services/qualityService';
import purchaseOrderService from './services/purchaseOrderService';
import './App.css';
import FarmerManagement from './pages/FarmerManagement';
import stockMovementService from './services/stockMovementService';

export default function App({ roleKey: propRoleKey }) {
  const params = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();

  const rawRole = propRoleKey || params.roleKey || localStorage.getItem('role') || 'fpo_manager';
  const role = (rawRole === 'fpo_manager' || rawRole === 'fpo_staff') ? 'fpo' : rawRole;
  const activeTab = params.tabName || (
    rawRole === 'fpo_staff' ? 'farmer' : 
    rawRole === 'farmer' ? 'farmer' : 
    rawRole === 'market_partner' ? 'market' : 
    'dashboard'
  );

  const setRole = (newRole) => {
    localStorage.setItem('role', newRole);
    const defaultTab = 
      newRole === 'farmer' ? 'farmer' : 
      newRole === 'market_partner' ? 'market' : 
      'dashboard';
    const pathPrefix = 
      newRole === 'fpo_manager' ? 'dashboard' : 
      newRole === 'fpo_staff' ? 'staff' : 
      newRole === 'market_partner' ? 'marketplace' : 
      newRole;
    navigate(`/${pathPrefix}/${defaultTab}`);
  };

  const setActiveTab = (newTab) => {
    // Map raw role to correct path prefix
    const pathPrefix = 
      rawRole === 'fpo_manager' ? 'dashboard' : 
      rawRole === 'fpo_staff' ? 'staff' : 
      rawRole === 'market_partner' ? 'marketplace' : 
      rawRole;
    navigate(`/${pathPrefix}/${newTab}`);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('wakhar_language') || 'en';
  });

  // Database states fetched from FastAPI Backend
  const [intakes, setIntakes] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [activities, setActivities] = useState([]);

  // Seeding support lookups
  const [dbCommodities, setDbCommodities] = useState([]);
  const [dbWarehouses, setDbWarehouses] = useState([]);
  const [dbFarmers, setDbFarmers] = useState([]);
  const [dbUsers, setDbUsers] = useState([]);
  const [dbFpos, setDbFpos] = useState([]);
  const [pos, setPos] = useState([]);
  const [dbMovements, setDbMovements] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Payments filtering states
  const [payFromDate, setPayFromDate] = useState('');
  const [payToDate, setPayToDate] = useState('');
  const [payStatus, setPayStatus] = useState('All');
  const [payBank, setPayBank] = useState('All');
  const [paySearch, setPaySearch] = useState('');

  // Add User Form states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    phone: '',
    email: '',
    roleId: '3', // FPO Staff
    fpoId: '1',
    password: ''
  });
  const [addUserError, setAddUserError] = useState('');
  const [addUserLoading, setAddUserLoading] = useState(false);

  // Edit User Form states
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUser, setEditUser] = useState({
    id: null,
    fullName: '',
    phone: '',
    email: '',
    roleId: '3',
    fpoId: '1',
    password: '',
    isActive: true
  });
  const [editUserError, setEditUserError] = useState('');
  const [editUserLoading, setEditUserLoading] = useState(false);

  // Edit FPO Form states
  const [showEditFpoModal, setShowEditFpoModal] = useState(false);
  const [editFpo, setEditFpo] = useState({
    id: null,
    name: '',
    code: '',
    region: '',
    district: '',
    contactPhone: '',
    contactEmail: '',
    aggregatorId: ''
  });
  const [editFpoError, setEditFpoError] = useState('');
  const [editFpoLoading, setEditFpoLoading] = useState(false);

  // Add FPO Form states
  const [showAddFpoModal, setShowAddFpoModal] = useState(false);
  const [newFpo, setNewFpo] = useState({
    name: '',
    code: '',
    region: '',
    district: '',
    contactPhone: '',
    contactEmail: '',
    aggregatorId: ''
  });
  const [addFpoError, setAddFpoError] = useState('');
  const [addFpoLoading, setAddFpoLoading] = useState(false);

  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  // Mappers
  const mapLotToUI = useCallback((lot) => {
    const gradeClasses = {
      grade_a: 'badge-green',
      grade_b: 'badge-amber',
      grade_c: 'badge-orange',
      rejected: 'badge-red',
      pending: 'badge-gray'
    };
    const gradeLabels = {
      grade_a: 'Grade A',
      grade_b: 'Grade B',
      grade_c: 'Grade C',
      rejected: 'Rejected',
      pending: 'QC Pending'
    };
    const statusLabels = {
      available: 'Available',
      reserved: 'Reserved',
      qc_pending: 'QC Pending',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      returned: 'Returned'
    };
    
    return {
      id: lot.lot_code,
      dbId: lot.id,
      farmerId: lot.farmer?.farmer_code || `FM-${lot.farmer_id}`,
      dbFarmerId: lot.farmer_id,
      farmerName: lot.farmer?.name || 'Unknown Farmer',
      commodity: lot.commodity?.name || 'Unknown Crop',
      variety: lot.variety || '',
      quantity: parseFloat(lot.quantity_kg),
      bags: lot.bag_count,
      moisture: parseFloat(lot.moisture_pct || 0),
      grade: gradeLabels[lot.grade] || lot.grade,
      gradeClass: gradeClasses[lot.grade] || 'badge-gray',
      warehouse: lot.warehouse?.name || 'Unknown Warehouse',
      warehouseId: lot.warehouse_id,
      fpoId: lot.warehouse?.fpo_id,
      zone: lot.zone || '',
      status: statusLabels[lot.status] || lot.status,
      date: lot.intake_date ? new Date(lot.intake_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date',
      dateRaw: lot.intake_date,
      remarks: lot.remarks || '',
      qualityRecords: lot.quality_records || []
    };
  }, []);

  const mapDispatchToUI = useCallback((dn) => {
    const statusLabels = {
      created: 'Created',
      in_transit: 'In Transit',
      delivered: 'Delivered'
    };
    
    const timeline = (dn.timeline_events || [])
      .sort((a, b) => (a.event_order || 0) - (b.event_order || 0))
      .map(event => ({
        title: event.event_title,
        sub: event.event_description || new Date(event.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        done: event.is_completed,
        active: !event.is_completed
      }));

    return {
      id: dn.dn_code,
      dbId: dn.id,
      lotId: dn.lot?.lot_code || '',
      buyerId: dn.buyer_id,
      warehouseId: dn.lot?.warehouse_id,
      fpoId: dn.lot?.warehouse?.fpo_id,
      commodity: dn.commodity_desc || 'Unknown',
      quantity: `${parseFloat(dn.dispatch_quantity_kg) / 1000} MT`,
      quantityKg: parseFloat(dn.dispatch_quantity_kg),
      destination: dn.destination,
      vehicle: dn.vehicle_reg,
      status: statusLabels[dn.status] || dn.status,
      timeline: timeline.length > 0 ? timeline : [
        { title: 'Dispatch Note Created', sub: 'Just now', done: true }
      ]
    };
  }, []);

  const mapReceiptToUI = useCallback((wr) => {
    const pledgeStatusLabels = {
      none: 'None',
      applied: 'Applied',
      disbursed: 'Disbursed'
    };
    
    const gradeLabels = {
      grade_a: 'Grade A',
      grade_b: 'Grade B',
      grade_c: 'Grade C',
      rejected: 'Rejected',
      pending: 'QC Pending'
    };

    return {
      id: wr.wr_code,
      dbId: wr.id,
      lotId: wr.lot?.lot_code || '',
      farmerId: wr.farmer?.farmer_code || `FM-${wr.farmer_id}`,
      dbFarmerId: wr.farmer_id,
      farmerName: wr.farmer?.name || 'Unknown',
      commodity: wr.lot?.commodity?.name || 'Unknown',
      variety: wr.lot?.variety || '',
      quantity: parseFloat(wr.quantity_kg),
      bags: wr.lot?.bag_count || 0,
      moisture: parseFloat(wr.lot?.moisture_pct || 0),
      grade: gradeLabels[wr.lot?.grade] || wr.lot?.grade || 'QC Pending',
      value: parseFloat(wr.valuation),
      collateralStatus: pledgeStatusLabels[wr.collateral_status] || 'None',
      pledgeBank: wr.pledge_bank,
      warehouse: wr.lot?.warehouse?.name || 'Unknown Warehouse',
      warehouseId: wr.lot?.warehouse_id,
      fpoId: wr.lot?.warehouse?.fpo_id,
      zone: wr.lot?.zone || '',
      loanAmount: parseFloat(wr.loan_amount || 0),
      date: wr.issue_date ? new Date(wr.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      dateRaw: wr.issue_date,
      validity: wr.expiry_date ? new Date(wr.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
    };
  }, []);

  const loadAllData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [lotsData, dispatchesData, receiptsData, statsData, commoditiesData, warehousesData, farmersData, usersData, fposData, posData, movementsData] = await Promise.all([
        inventoryService.getLots(),
        dispatchService.getDispatches(),
        inventoryService.getReceipts(),
        dashboardService.getStats(),
        commodityService.getCommodities(),
        warehouseService.getWarehouses(),
        farmerService.getFarmers(),
        apiClient.get('/api/users/').then(r => r.data).catch(() => []),
        fpoService.getFPOs().catch(() => []),
        purchaseOrderService.getPurchaseOrders().catch(() => []),
        stockMovementService.getStockMovements().catch(() => [])
      ]);

      setDbCommodities(commoditiesData);
      setDbWarehouses(warehousesData);
      setDbFarmers(farmersData);
      setDbUsers(usersData);
      setDbFpos(fposData);
      setPos(posData || []);
      setDbMovements(movementsData || []);

      setIntakes(lotsData.map(mapLotToUI));
      setDispatches(dispatchesData.map(mapDispatchToUI));
      setReceipts(receiptsData.map(mapReceiptToUI));
      
      const mappedActivities = (statsData.recent_activity || []).map(log => ({
        type: log.type,
        text: log.message,
        time: log.created_at ? new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(log.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Just now'
      }));
      setActivities(mappedActivities);
    } catch (err) {
      console.error('Failed to load data:', err);
      setDataError('Could not sync with the Wakhar API. Make sure the backend server is running.');
    } finally {
      setDataLoading(false);
      setIsInitialLoad(false);
    }
  }, [mapLotToUI, mapDispatchToUI, mapReceiptToUI, rawRole]);

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser, loadAllData]);

  // Sync language to localstorage
  useEffect(() => {
    localStorage.setItem('wakhar_language', language);
  }, [language]);

  // Dynamic DOM Translation Observer
  useEffect(() => {
    const substrings = getSubstringsDict() || {};

    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const walkAndTranslate = (node) => {
      if (!node) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const originalText = node.nodeValue;
        const trimmed = originalText.trim();
        if (trimmed) {
          if (node.__translatedText && originalText === node.__translatedText) {
            return;
          }
          
          let translated = getTranslation(trimmed, language);
          
          if (translated === trimmed) {
            const subDict = substrings[language];
            if (subDict) {
              let replacedText = trimmed;
              const keys = Object.keys(subDict).sort((a, b) => b.length - a.length);
              let hasChange = false;
              for (const key of keys) {
                const isWord = /^[a-zA-Z0-9_\-\s]+$/.test(key);
                let regex;
                if (isWord) {
                  regex = new RegExp('\\b' + escapeRegExp(key) + '\\b', 'gi');
                } else {
                  regex = new RegExp(escapeRegExp(key), 'g');
                }
                if (regex.test(replacedText)) {
                  replacedText = replacedText.replace(regex, subDict[key]);
                  hasChange = true;
                }
              }
              if (hasChange) {
                translated = replacedText;
              }
            }
          }

          if (translated && translated !== trimmed) {
            if (!node.__originalText) {
              node.__originalText = originalText;
            }
            const leading = originalText.match(/^\s*/)[0];
            const trailing = originalText.match(/\s*$/)[0];
            node.__translatedText = leading + translated + trailing;
            node.nodeValue = node.__translatedText;
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toUpperCase();
        if (tagName === 'SCRIPT' || tagName === 'STYLE') return;

        if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
          const placeholder = node.getAttribute('placeholder');
          if (placeholder) {
            if (node.__translatedPlaceholder && placeholder === node.__translatedPlaceholder) {
              // already translated
            } else {
              let translated = getTranslation(placeholder, language);
              if (translated === placeholder) {
                const subDict = substrings[language];
                if (subDict) {
                  let replacedText = placeholder;
                  const keys = Object.keys(subDict).sort((a, b) => b.length - a.length);
                  let hasChange = false;
                  for (const key of keys) {
                    const isWord = /^[a-zA-Z0-9_\-\s]+$/.test(key);
                    let regex;
                    if (isWord) {
                      regex = new RegExp('\\b' + escapeRegExp(key) + '\\b', 'gi');
                    } else {
                      regex = new RegExp(escapeRegExp(key), 'g');
                    }
                    if (regex.test(replacedText)) {
                      replacedText = replacedText.replace(regex, subDict[key]);
                      hasChange = true;
                    }
                  }
                  if (hasChange) {
                    translated = replacedText;
                  }
                }
              }
              if (translated && translated !== placeholder) {
                node.__originalPlaceholder = placeholder;
                node.__translatedPlaceholder = translated;
                node.setAttribute('placeholder', translated);
              }
            }
          }
        }

        for (let i = 0; i < node.childNodes.length; i++) {
          walkAndTranslate(node.childNodes[i]);
        }
      }
    };

    const walkAndRestore = (node) => {
      if (!node) return;
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.__originalText !== undefined) {
          node.nodeValue = node.__originalText;
          node.__translatedText = undefined;
          node.__originalText = undefined;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toUpperCase();
        if (tagName === 'SCRIPT' || tagName === 'STYLE') return;

        if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
          if (node.__originalPlaceholder !== undefined) {
            node.setAttribute('placeholder', node.__originalPlaceholder);
            node.__translatedPlaceholder = undefined;
            node.__originalPlaceholder = undefined;
          }
        }

        for (let i = 0; i < node.childNodes.length; i++) {
          walkAndRestore(node.childNodes[i]);
        }
      }
    };

    let observer = null;
    const applyTranslation = () => {
      if (observer) observer.disconnect();
      if (language === 'en') {
        walkAndRestore(document.body);
      } else {
        walkAndTranslate(document.body);
      }
      if (observer) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['placeholder']
        });
      }
    };

    observer = new MutationObserver(() => {
      applyTranslation();
    });

    applyTranslation();

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder']
    });

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [language]);

  // Alert warnings (high moisture lots)
  const highMoistureLots = intakes.filter(lot => lot.moisture > 14 && lot.status !== 'Returned');

  // Operation Handlers
  const handleAddIntake = async (newLot) => {
    try {
      const comm = dbCommodities.find(c => c.name === newLot.commodity);
      const wh = dbWarehouses.find(w => w.name.includes(newLot.warehouse));
      
      const gradeMapping = {
        'Grade A': 'grade_a',
        'Grade B': 'grade_b',
        'Grade C': 'grade_c',
        'Rejected': 'rejected',
        'QC Pending': 'pending'
      };

      const statusMapping = {
        'Available': 'available',
        'Reserved': 'reserved',
        'QC Pending': 'qc_pending',
        'In Transit': 'in_transit',
        'Delivered': 'delivered',
        'Returned': 'returned'
      };

      const lotPayload = {
        lot_code: newLot.id,
        farmer_id: parseInt(newLot.farmerId),
        commodity_id: comm ? comm.id : 1,
        variety: newLot.variety,
        quantity_kg: parseFloat(newLot.quantity),
        bag_count: parseInt(newLot.bags),
        moisture_pct: parseFloat(newLot.moisture),
        grade: gradeMapping[newLot.grade] || 'pending',
        warehouse_id: wh ? wh.id : 1,
        zone: newLot.zone,
        status: statusMapping[newLot.status] || 'qc_pending',
        intake_type: 'walk_in',
        remarks: newLot.remarks,
        intake_date: new Date().toISOString().split('T')[0]
      };

      const lotRes = await inventoryService.createLot(lotPayload);

      // Simulate ERPNext integration if active
      apiSim.syncERPNextStock(newLot);

      if (lotRes.grade === 'grade_a' || lotRes.grade === 'grade_b' || lotRes.grade === 'grade_c') {
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        
        await inventoryService.createReceipt({
          wr_code: `WR-2026-0${348 + receipts.length}`,
          lot_id: lotRes.id,
          farmer_id: lotRes.farmer_id,
          issue_date: new Date().toISOString().split('T')[0],
          expiry_date: expiryDate.toISOString().split('T')[0],
          quantity_kg: lotRes.quantity_kg,
          grade: lotRes.grade,
          valuation: lotRes.quantity_kg * (comm ? comm.base_rate : 22.0)
        });

        const farmerPhone = dbFarmers.find(f => f.id === lotRes.farmer_id)?.phone || '+919876543210';
        apiSim.sendSMSNotification(farmerPhone, `WAKHAR: Deposit of ${lotRes.quantity_kg} kg recorded. Grade: ${lotRes.grade}.`);
      }

      await loadAllData();
    } catch (err) {
      console.error('Intake failed:', err);
      toast.error('Failed to register intake on backend.');
    }
  };

  const handleUpdateGrade = async (lotId, grade, gradeClass, moisture, status, foreignMatter, protein, brokenGrains, inspector) => {
    try {
      const lot = intakes.find(l => l.id === lotId);
      if (!lot) return;

      const gradeMapping = {
        'Grade A': 'grade_a',
        'Grade B': 'grade_b',
        'Grade C': 'grade_c',
        'Rejected': 'rejected',
        'QC Pending': 'pending'
      };

      const statusMapping = {
        'Available': 'available',
        'Reserved': 'reserved',
        'QC Pending': 'qc_pending',
        'In Transit': 'in_transit',
        'Delivered': 'delivered',
        'Returned': 'returned'
      };

      const mappedGrade = gradeMapping[grade] || 'pending';
      const mappedStatus = statusMapping[status] || 'qc_pending';

      // Create Quality Control Record
      await qualityService.createQualityRecord({
        qc_code: `QC-${lot.id}-${Math.floor(Math.random() * 900 + 100)}`,
        lot_id: lot.dbId,
        moisture_pct: parseFloat(moisture),
        foreign_matter_pct: parseFloat(foreignMatter || 0.0),
        broken_grain_pct: parseFloat(brokenGrains || 0.0),
        protein_pct: parseFloat(protein || 0.0),
        grade_awarded: mappedGrade,
        inspected_by: currentUser?.id || 1,
        inspection_date: new Date().toISOString(),
        remarks: `AGMARK certified by ${inspector || 'Govt Lab Officer'}`
      });

      // Update Lot
      await inventoryService.updateLot(lot.dbId, {
        lot_code: lot.id,
        farmer_id: lot.dbFarmerId,
        commodity_id: dbCommodities.find(c => c.name === lot.commodity)?.id || 1,
        variety: lot.variety,
        quantity_kg: lot.quantity,
        bag_count: lot.bags,
        moisture_pct: parseFloat(moisture),
        grade: mappedGrade,
        warehouse_id: dbWarehouses.find(w => w.name === lot.warehouse)?.id || 1,
        zone: lot.zone,
        status: mappedStatus,
        remarks: lot.remarks,
        intake_date: new Date().toISOString().split('T')[0]
      });

      // Create Warehouse Receipt if certified & not existing
      if (mappedGrade !== 'rejected') {
        const existingReceipt = receipts.find(r => r.lotId === lotId);
        if (!existingReceipt) {
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + 3);
          const baseRate = dbCommodities.find(c => c.name === lot.commodity)?.base_rate || 22.0;

          await inventoryService.createReceipt({
            wr_code: `WR-2026-0${348 + receipts.length}`,
            lot_id: lot.dbId,
            farmer_id: lot.dbFarmerId,
            issue_date: new Date().toISOString().split('T')[0],
            expiry_date: expiryDate.toISOString().split('T')[0],
            quantity_kg: lot.quantity,
            grade: mappedGrade,
            valuation: lot.quantity * baseRate
          });
        }
      }

      await loadAllData();
    } catch (err) {
      console.error('Update grade failed:', err);
      toast.error('Failed to update quality record on backend.');
    }
  };

  const handleDispatchLot = async (lotId) => {
    try {
      const lot = intakes.find(l => l.id === lotId);
      if (!lot) return;

      await inventoryService.updateLot(lot.dbId, {
        lot_code: lot.id,
        farmer_id: lot.dbFarmerId,
        commodity_id: dbCommodities.find(c => c.name === lot.commodity)?.id || 1,
        variety: lot.variety,
        quantity_kg: lot.quantity,
        bag_count: lot.bags,
        moisture_pct: lot.moisture,
        grade: lot.grade === 'Grade A' ? 'grade_a' : lot.grade === 'Grade B' ? 'grade_b' : 'pending',
        warehouse_id: dbWarehouses.find(w => w.name === lot.warehouse)?.id || 1,
        zone: lot.zone,
        status: 'reserved',
        remarks: lot.remarks,
        intake_date: new Date().toISOString().split('T')[0]
      });

      await loadAllData();
    } catch (err) {
      console.error('Dispatch lot reservation failed:', err);
    }
  };

  const handleReserveLot = async (lotId) => {
    try {
      const lot = intakes.find(l => l.id === lotId);
      if (!lot) return;

      await inventoryService.updateLot(lot.dbId, {
        lot_code: lot.id,
        farmer_id: lot.dbFarmerId,
        commodity_id: dbCommodities.find(c => c.name === lot.commodity)?.id || 1,
        variety: lot.variety,
        quantity_kg: lot.quantity,
        bag_count: lot.bags,
        moisture_pct: lot.moisture,
        grade: lot.grade === 'Grade A' ? 'grade_a' : lot.grade === 'Grade B' ? 'grade_b' : 'pending',
        warehouse_id: dbWarehouses.find(w => w.name === lot.warehouse)?.id || 1,
        zone: lot.zone,
        status: 'reserved',
        remarks: lot.remarks,
        intake_date: new Date().toISOString().split('T')[0]
      });

      await loadAllData();
    } catch (err) {
      console.error('Reserve lot failed:', err);
    }
  };

  const handleAddDispatch = async (newDispatch, lotId) => {
    try {
      const lot = intakes.find(l => l.id === lotId);
      if (!lot) return;

      const qtyKg = parseFloat(newDispatch.quantity.replace(' MT', '')) * 1000 || lot.quantity;

      await dispatchService.createDispatch({
        dn_code: newDispatch.id,
        lot_id: lot.dbId,
        dispatch_quantity_kg: qtyKg,
        commodity_desc: newDispatch.commodity,
        quantity_desc: newDispatch.quantity,
        destination: newDispatch.destination,
        destination_lat: newDispatch.destinationLat || null,
        destination_lng: newDispatch.destinationLng || null,
        vehicle_reg: newDispatch.vehicle,
        status: 'in_transit',
        dispatch_date: new Date().toISOString()
      });

      apiSim.triggerFleetbaseDispatch(newDispatch);
      await loadAllData();
    } catch (err) {
      console.error('Add dispatch failed:', err);
      toast.error('Failed to register dispatch on backend.');
    }
  };

  const handleApplyCollateral = async (receiptId, bank, amount) => {
    try {
      const targetWR = receipts.find(wr => wr.id === receiptId);
      if (!targetWR) return;

      const receipt = await inventoryService.getReceipt(targetWR.dbId);
      receipt.collateral_status = 'applied';
      receipt.pledge_bank = bank;
      receipt.loan_amount = parseFloat(amount);

      await inventoryService.updateReceipt(targetWR.dbId, receipt);
      await loadAllData();

      // Simulate approved state after delay
      setTimeout(async () => {
        try {
          const checkReceipt = await inventoryService.getReceipt(targetWR.dbId);
          checkReceipt.collateral_status = 'disbursed';
          await inventoryService.updateReceipt(targetWR.dbId, checkReceipt);
          await loadAllData();
        } catch (subErr) {
          console.error('Delayed disbursal update failed:', subErr);
        }
      }, 4000);
    } catch (err) {
      console.error('Apply collateral failed:', err);
      toast.error('Failed to apply collateral on backend.');
    }
  };

  const handleUpdateDispatch = async (updatedDispatch) => {
    try {
      const statusMapping = {
        'Created': 'created',
        'In Transit': 'in_transit',
        'Delivered': 'delivered'
      };

      await dispatchService.updateDispatch(updatedDispatch.dbId, {
        dn_code: updatedDispatch.id,
        lot_id: intakes.find(l => l.id === updatedDispatch.lotId)?.dbId || 1,
        dispatch_quantity_kg: updatedDispatch.quantityKg || 1000,
        commodity_desc: updatedDispatch.commodity,
        quantity_desc: updatedDispatch.quantity,
        destination: updatedDispatch.destination,
        vehicle_reg: updatedDispatch.vehicle,
        status: statusMapping[updatedDispatch.status] || 'in_transit',
        dispatch_date: new Date().toISOString()
      });

      await loadAllData();
    } catch (err) {
      console.error('Update dispatch failed:', err);
    }
  };

  const handleCreatePO = async (newPoData) => {
    try {
      const comm = dbCommodities.find(c => newPoData.commodity.includes(c.name));
      const wh = dbWarehouses.find(w => w.name.includes(newPoData.warehouse));

      const payload = {
        po_code: newPoData.id,
        buyer_id: currentUser ? currentUser.id : 1,
        commodity_id: comm ? comm.id : 1,
        grade: 'grade_a',
        quantity_kg: parseFloat(newPoData.qty) * 1000,
        price_per_mt: parseFloat(newPoData.price),
        warehouse_id: wh ? wh.id : 1
      };

      await purchaseOrderService.createPurchaseOrder(payload);
      await loadAllData();
    } catch (err) {
      console.error('Create PO failed:', err);
      toast.error('Failed to register Purchase Order on backend.');
    }
  };

  const handlePayPO = async (poDbId) => {
    try {
      await purchaseOrderService.updatePurchaseOrder(poDbId, {
        payment_status: 'confirmed',
        payment_ref: 'SIMULATED_RAZORPAY_REF'
      });
      await loadAllData();
    } catch (err) {
      console.error('Pay PO failed:', err);
      toast.error('Failed to simulate PO payment on backend.');
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setAddUserError('');
    setAddUserLoading(true);

    try {
      const selectedRole = [
        { id: 1, name: 'admin' },
        { id: 2, name: 'farmer' },
        { id: 3, name: 'fpo_staff' },
        { id: 4, name: 'fpo_manager' },
        { id: 5, name: 'aggregator' },
        { id: 6, name: 'market_partner' }
      ].find(r => r.id === Number(newUser.roleId));

      const initials = newUser.fullName
        ? newUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'US';

      const payload = {
        full_name: newUser.fullName,
        phone: newUser.phone.trim(),
        email: newUser.email.trim() || null,
        role_id: Number(newUser.roleId),
        role: selectedRole ? selectedRole.name : 'fpo_staff',
        fpo_id: (selectedRole?.name === 'fpo_manager' || selectedRole?.name === 'fpo_staff' || selectedRole?.name === 'aggregator') ? Number(newUser.fpoId) : null,
        password_hash: newUser.password || '123456',
        initials: initials,
        is_active: true
      };

      await apiClient.post('/api/users/', payload);
      await loadAllData();
      
      // Reset form and close
      setNewUser({
        fullName: '',
        phone: '',
        email: '',
        roleId: '3',
        fpoId: '1',
        password: ''
      });
      setShowAddUserModal(false);
    } catch (err) {
      console.error('Failed to create user:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        const msg = Array.isArray(detail)
          ? detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ')
          : detail;
        setAddUserError(msg);
      } else {
        setAddUserError('Failed to create user. Please make sure the phone number is unique and backend is running.');
      }
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleEditUserClick = (usr) => {
    const roleMap = {
      'admin': '1',
      'farmer': '2',
      'fpo_staff': '3',
      'fpo_manager': '4',
      'aggregator': '5',
      'market_partner': '6'
    };
    setEditUser({
      id: usr.id,
      fullName: usr.full_name,
      phone: usr.phone,
      email: usr.email || '',
      roleId: roleMap[usr.role] || '3',
      fpoId: usr.fpo_id?.toString() || '1',
      password: '',
      isActive: usr.is_active
    });
    setEditUserError('');
    setShowEditUserModal(true);
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    setEditUserError('');
    setEditUserLoading(true);

    try {
      const selectedRole = [
        { id: 1, name: 'admin' },
        { id: 2, name: 'farmer' },
        { id: 3, name: 'fpo_staff' },
        { id: 4, name: 'fpo_manager' },
        { id: 5, name: 'aggregator' },
        { id: 6, name: 'market_partner' }
      ].find(r => r.id === Number(editUser.roleId));

      const initials = editUser.fullName
        ? editUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'US';

      const payload = {
        full_name: editUser.fullName,
        phone: editUser.phone.trim(),
        email: editUser.email.trim() || null,
        role_id: Number(editUser.roleId),
        role: selectedRole ? selectedRole.name : 'fpo_staff',
        fpo_id: (selectedRole?.name === 'fpo_manager' || selectedRole?.name === 'fpo_staff' || selectedRole?.name === 'aggregator') ? Number(editUser.fpoId) : null,
        password_hash: editUser.password.trim() || null,
        initials: initials,
        is_active: editUser.isActive
      };

      await apiClient.put(`/api/users/${editUser.id}`, payload);
      toast.success("User updated successfully!");
      await loadAllData();
      setShowEditUserModal(false);
    } catch (err) {
      print(err)
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ')
        : detail || 'Failed to update user.';
      setEditUserError(msg);
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleEditFpoClick = (fpo) => {
    setEditFpo({
      id: fpo.id,
      name: fpo.name,
      code: fpo.code,
      region: fpo.region || '',
      district: fpo.district || '',
      contactPhone: fpo.contact_phone || '',
      contactEmail: fpo.contact_email || '',
      aggregatorId: fpo.aggregator_id?.toString() || ''
    });
    setEditFpoError('');
    setShowEditFpoModal(true);
  };

  const handleEditFpoSubmit = async (e) => {
    e.preventDefault();
    setEditFpoError('');
    setEditFpoLoading(true);

    try {
      const payload = {
        name: editFpo.name.trim(),
        code: editFpo.code.trim().toUpperCase(),
        region: editFpo.region.trim() || null,
        district: editFpo.district.trim() || null,
        state: 'Maharashtra',
        contact_phone: editFpo.contactPhone.trim() || null,
        contact_email: editFpo.contactEmail.trim() || null,
        aggregator_id: editFpo.aggregatorId ? Number(editFpo.aggregatorId) : null
      };

      await fpoService.updateFPO(editFpo.id, payload);
      toast.success(`FPO "${editFpo.name}" updated successfully!`);
      await loadAllData();
      setShowEditFpoModal(false);
    } catch (err) {
      setEditFpoError(err.response?.data?.detail || 'Failed to update FPO. Please check parameters.');
    } finally {
      setEditFpoLoading(false);
    }
  };

  const handleDeleteFpo = async (fpoId, name) => {
    if (!window.confirm(`Are you sure you want to delete FPO "${name}"?`)) return;
    try {
      await fpoService.deleteFPO(fpoId);
      toast.success(`FPO "${name}" deleted successfully.`);
      await loadAllData();
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to delete FPO.";
      toast.error(detail);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiClient.delete(`/api/users/${userId}`);
      toast.success("User deleted successfully!");
      await loadAllData();
    } catch (err) {
      console.error("Failed to delete user:", err);
      const detail = err.response?.data?.detail || "Failed to delete user.";
      toast.error(detail);
    }
  };

  const handleCreateFpoSubmit = async (e) => {
    e.preventDefault();
    setAddFpoError('');
    setAddFpoLoading(true);

    try {
      const payload = {
        name: newFpo.name.trim(),
        code: newFpo.code.trim().toUpperCase(),
        region: newFpo.region.trim() || null,
        district: newFpo.district.trim() || null,
        state: 'Maharashtra',
        contact_phone: newFpo.contactPhone.trim() || null,
        contact_email: newFpo.contactEmail.trim() || null,
        aggregator_id: newFpo.aggregatorId ? Number(newFpo.aggregatorId) : null
      };

      await fpoService.createFPO(payload);
      toast.success(`FPO "${newFpo.name}" registered successfully!`);
      await loadAllData();

      // Reset
      setNewFpo({
        name: '',
        code: '',
        region: '',
        district: '',
        contactPhone: '',
        contactEmail: '',
        aggregatorId: ''
      });
      setShowAddFpoModal(false);
    } catch (err) {
      console.error('Failed to create FPO:', err);
      setAddFpoError(err.response?.data?.detail || 'Failed to create FPO. Please check your parameters.');
    } finally {
      setAddFpoLoading(false);
    }
  };

  // Render Screens
  if (authLoading || (currentUser && dataLoading && isInitialLoad)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#FEFCF8',
        color: '#1C1A14',
        fontFamily: 'system-ui'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🌾</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Wakhar WMS</div>
        <div style={{ fontSize: '14px', color: '#8A8070', marginTop: '8px' }}>Syncing dashboard parameters...</div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#FEFCF8',
        color: '#1C1A14',
        fontFamily: 'var(--font-sans)',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Failed to Load Dashboard Data</h2>
        <p style={{ color: 'var(--text2)', marginBottom: '24px', maxWidth: '400px' }}>{dataError}</p>
        <button className="btn btn-primary" onClick={loadAllData}>
          🔄 Retry Connection
        </button>
      </div>
    );
  }

  const mappedFarmers = dbFarmers.map(f => ({
    id: f.id.toString(),
    farmerCode: f.farmer_code,
    name: f.name,
    phone: f.phone,
    aadhaar: f.aadhaar,
    village: f.village
  }));

  return (
    <div className="app-container">
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        alertsCount={highMoistureLots.length}
        onShowAlertsModal={() => setShowAlertsModal(true)}
        intakesCount={intakes.filter(i => i.status === 'QC Pending').length}
        dispatchesCount={dispatches.filter(d => d.status === 'In Transit').length}
        language={language}
        setLanguage={setLanguage}
        role={role}
      >
        {activeTab === 'dashboard' && (
          <Dashboard
            intakes={intakes}
            dispatches={dispatches}
            receipts={receipts}
            setActiveTab={setActiveTab}
            activities={activities}
            language={language}
            role={role}
            currentUser={currentUser}
            dbWarehouses={dbWarehouses}
            dbFarmers={dbFarmers}
            dbFpos={dbFpos}
            dbUsers={dbUsers}
            pos={pos}
          />
        )}

        {activeTab === 'intake' && (
          <Intake
            intakes={intakes}
            onAddIntake={handleAddIntake}
            farmersList={mappedFarmers}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            language={language}
            dbWarehouses={dbWarehouses}
          />
        )}

        {activeTab === 'intake-new' && (
          <Intake
            intakes={intakes}
            onAddIntake={handleAddIntake}
            farmersList={mappedFarmers}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isWizardOverride={true}
            language={language}
            dbWarehouses={dbWarehouses}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory
            intakes={intakes}
            receipts={receipts}
            dispatches={dispatches}
            onDispatchLot={handleDispatchLot}
            searchQuery={searchQuery}
            language={language}
          />
        )}

        {activeTab === 'dispatch' && (
          <Dispatch
            dispatches={dispatches}
            intakes={intakes}
            onAddDispatch={handleAddDispatch}
            onUpdateDispatch={handleUpdateDispatch}
            searchQuery={searchQuery}
            language={language}
            role={role}
          />
        )}

        {activeTab === 'grading' && (
          <Grading
            intakes={intakes}
            onUpdateGrade={handleUpdateGrade}
            searchQuery={searchQuery}
            language={language}
            onAddActivity={async (type, text) => {
              // Activity is auto-logged by backend or we let it refresh
              await loadAllData();
            }}
          />
        )}

        {activeTab === 'receipts' && (() => {
          const dbFarmer = dbFarmers.find(f => {
            if (f.user_id && currentUser?.id && f.user_id === currentUser.id) {
              return true;
            }
            const normF = (f.phone || '').replace(/\D/g, '');
            const normU = (currentUser?.phone || '').replace(/\D/g, '');
            return normF === normU && normF !== '';
          });
          return (
            <Receipts
              receipts={receipts}
              intakes={intakes}
              onApplyCollateral={handleApplyCollateral}
              searchQuery={searchQuery}
              language={language}
              role={role}
              currentFarmerCode={dbFarmer?.farmer_code || ''}
            />
          );
        })()}

        {(activeTab === 'market' || activeTab === 'purchase-orders') && (
          <Market
            intakes={intakes}
            pos={pos}
            dbCommodities={dbCommodities}
            dbWarehouses={dbWarehouses}
            currentUser={currentUser}
            onReserveLot={handleReserveLot}
            onCreatePO={handleCreatePO}
            onPayPO={handlePayPO}
            searchQuery={searchQuery}
            language={language}
            role={role}
            activeTab={activeTab}
          />
        )}

        {activeTab === 'transfers' && (
          <Transfers
            intakes={intakes}
            warehouses={dbWarehouses}
            language={language}
            role={role}
            onAddActivity={async () => {
              await loadAllData();
            }}
          />
        )}

        {activeTab === 'stockcount' && (
          <StockCount
            intakes={intakes}
            language={language}
          />
        )}

        {activeTab === 'farmer' && (currentUser?.role === 'fpo_staff' || currentUser?.role === 'fpo_manager') ? (
          <FarmerManagement
            language={language}
            dbFarmers={dbFarmers}
            currentUser={currentUser}
            onRefreshData={loadAllData}
          />
        ) : (activeTab === 'farmer' || activeTab === 'withdrawal-requests' || activeTab === 'farmer-profile') && (
          <FarmerPortal
            intakes={intakes}
            receipts={receipts}
            farmersList={mappedFarmers}
            dbFarmers={dbFarmers}
            dbFpos={dbFpos}
            dbWarehouses={dbWarehouses}
            dbMovements={dbMovements}
            dbUsers={dbUsers}
            currentUser={currentUser}
            onApplyCollateral={handleApplyCollateral}
            language={language}
            role={role}
            activeTab={activeTab}
            onAmendReceipt={async (receiptId, newQty, bags, val) => {
              try {
                const targetWR = receipts.find(wr => wr.id === receiptId);
                if (targetWR) {
                  const diffKg = targetWR.quantity - newQty;
                  if (diffKg > 0) {
                    await inventoryService.withdrawReceipt(targetWR.dbId, diffKg);
                  } else {
                    const wr = await inventoryService.getReceipt(targetWR.dbId);
                    wr.quantity_kg = newQty;
                    wr.valuation = val;
                    await inventoryService.updateReceipt(targetWR.dbId, wr);
                    
                    const lot = await inventoryService.getLot(wr.lot_id);
                    lot.quantity_kg = newQty;
                    lot.bag_count = bags;
                    await inventoryService.updateLot(wr.lot_id, lot);
                  }
                  await loadAllData();
                }
              } catch (err) {
                console.error('Amend receipt failed:', err);
                toast.error('Failed to amend receipt on backend.');
              }
            }}
            onAddActivity={async () => {
              await loadAllData();
            }}
          />
        )}

        {activeTab === 'aggregator' && (
          <AggregatorView
            intakes={intakes}
            onReserveLot={handleReserveLot}
            onAddDispatch={handleAddDispatch}
            language={language}
            onAddActivity={async () => {
              await loadAllData();
            }}
          />
        )}

        {activeTab === 'warehouses' && (
          <Warehouses
            intakes={intakes}
            language={language}
            dbWarehouses={dbWarehouses}
            dbFarmers={dbFarmers}
            dbFpos={dbFpos}
            onRefreshData={loadAllData}
            role={rawRole}
          />
        )}

        {activeTab === 'reports' && (
          <Reports
            intakes={intakes}
            receipts={receipts}
            activities={activities}
            language={language}
            role={role}
          />
        )}

        {activeTab === 'integrations' && (
          <Integrations language={language} />
        )}

        {activeTab === 'rbac' && (
          <RBAC language={language} onAddActivity={loadAllData} />
        )}

        {/* Dynamic renders for FPO Staff Scanner / Admin User / FPO Management / Market Partner Payments */}
        {activeTab === 'scanner' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 className="section-title">Intake Barcode Scanner</h2>
            <div className="card" style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', padding: '40px 20px', background: '#1a1a1a', color: '#fff' }}>
              <span style={{ fontSize: '48px' }}>📷</span>
              <h3 style={{ margin: '16px 0 8px', color: 'white' }}>Scan Driver Gatepass QR</h3>
              <p style={{ color: '#ccc', fontSize: '13px', marginBottom: '24px' }}>Position the coupon code under the camera guidelines to scan.</p>
              <div style={{ width: '200px', height: '200px', border: '3px solid var(--green)', margin: '0 auto 24px', position: 'relative', background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px', border: '1px dashed rgba(255,255,255,0.2)' }} />
              </div>
              <button className="btn btn-primary" onClick={() => alert('Simulating scanner beep... decoded BK-0081')}>Simulate Camera Scan</button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="section-title">System User Management</h2>
              <button className="btn btn-primary" onClick={() => { setAddUserError(''); setShowAddUserModal(true); }}>+ Create User</button>
            </div>
            <div className="card">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Full Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Linked FPO / Aggregator</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbUsers.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text3)' }}>Loading system users...</td>
                      </tr>
                    ) : (
                      dbUsers.map(usr => {
                        const isSelf = currentUser?.id === usr.id;
                        return (
                          <tr key={usr.id}>
                            <td><strong>USR-0{usr.id}</strong></td>
                            <td>{usr.full_name}</td>
                            <td>{usr.phone}</td>
                            <td>{usr.email || 'N/A'}</td>
                            <td><span className="badge badge-teal">{usr.role}</span></td>
                            <td>
                              {usr.fpo_name ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text1)' }}>
                                  🏢 {usr.fpo_name}
                                </span>
                              ) : usr.role === 'admin' ? (
                                <span style={{ color: 'var(--text3)', fontSize: '12px', fontStyle: 'italic' }}>⚙️ Global Admin</span>
                              ) : (
                                <span style={{ color: 'var(--text3)' }}>—</span>
                              )}
                            </td>
                            <td><span className={`badge ${usr.is_active ? 'badge-green' : 'badge-red'}`}>{usr.is_active ? 'Active' : 'Deactivated'}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: '4px 10px', fontSize: '12px', minWidth: 'auto', color: 'var(--amber)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                                  onClick={() => handleEditUserClick(usr)}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  className="btn btn-outline"
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    minWidth: 'auto',
                                    color: isSelf ? 'var(--text3)' : '#ef4444',
                                    borderColor: isSelf ? 'var(--border2)' : 'rgba(239, 68, 68, 0.3)',
                                    cursor: isSelf ? 'not-allowed' : 'pointer',
                                    opacity: isSelf ? 0.5 : 1,
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelf) {
                                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                      e.currentTarget.style.borderColor = '#ef4444';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelf) {
                                      e.currentTarget.style.background = 'transparent';
                                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                    }
                                  }}
                                  onClick={() => handleDeleteUser(usr.id)}
                                  disabled={isSelf}
                                  title={isSelf ? "Cannot delete yourself" : "Delete user"}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit User Modal Overlay */}
            {showEditUserModal && (
              <div className="modal-overlay" onClick={() => setShowEditUserModal(false)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                  <div className="modal-header">
                    <div className="modal-title">Edit System User</div>
                    <button className="modal-close" onClick={() => setShowEditUserModal(false)}>×</button>
                  </div>
                  
                  <form onSubmit={handleEditUserSubmit}>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' }}>
                      {editUserError && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '6px', padding: '10px', fontSize: '13px', textAlign: 'center' }}>
                          ❌ {editUserError}
                        </div>
                      )}

                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={editUser.fullName}
                          onChange={e => setEditUser({ ...editUser, fullName: e.target.value })}
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Phone Number (with Country Code)</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={editUser.phone}
                          onChange={e => setEditUser({ ...editUser, phone: e.target.value })}
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email Address (Optional)</label>
                        <input 
                          type="email" 
                          className="form-input" 
                          value={editUser.email}
                          onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">System Role</label>
                          <select 
                            className="form-select"
                            value={editUser.roleId}
                            onChange={e => {
                              const nextRoleId = e.target.value;
                              setEditUser({ 
                                ...editUser, 
                                roleId: nextRoleId,
                                fpoId: (rawRole === 'fpo_manager') ? currentUser?.fpo_id?.toString() || '1' : editUser.fpoId
                              });
                            }}
                            style={{ background: '#fff' }}
                          >
                            {rawRole === 'admin' ? (
                              <>
                                <option value="1">System Admin</option>
                                <option value="2">Farmer</option>
                                <option value="3">FPO Staff</option>
                                <option value="4">FPO Manager</option>
                                <option value="5">Aggregator</option>
                                <option value="6">Market Partner</option>
                              </>
                            ) : (
                              <option value="3">FPO Staff</option>
                            )}
                          </select>
                        </div>

                        {(editUser.roleId === '3' || editUser.roleId === '4' || editUser.roleId === '5') && (
                          <div className="form-group">
                            <label className="form-label">Linked FPO / Aggregator Hub</label>
                            {rawRole === 'fpo_manager' ? (
                              <div style={{ padding: '8px 12px', background: 'var(--surface2)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13.5px', fontWeight: '500' }}>
                                {dbFpos.find(f => f.id === currentUser?.fpo_id)?.name || 'My FPO'}
                              </div>
                            ) : (
                              <select 
                                className="form-select"
                                value={editUser.fpoId}
                                onChange={e => setEditUser({ ...editUser, fpoId: e.target.value })}
                                style={{ background: '#fff' }}
                              >
                                {dbFpos.map(fpo => (
                                  <option key={fpo.id} value={fpo.id}>{fpo.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">New Password / PIN (Leave blank to keep current)</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="Enter new password/PIN"
                          value={editUser.password}
                          onChange={e => setEditUser({ ...editUser, password: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
                          <input
                            type="checkbox"
                            checked={editUser.isActive}
                            onChange={e => setEditUser({ ...editUser, isActive: e.target.checked })}
                            style={{ width: '16px', height: '16px' }}
                          />
                          <span>Active Account</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-footer" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowEditUserModal(false)} disabled={editUserLoading}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={editUserLoading} style={{ background: 'var(--green)', borderColor: 'var(--green)' }}>
                        {editUserLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Create User Modal Overlay */}
            {showAddUserModal && (
              <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                  <div className="modal-header">
                    <div className="modal-title">Create System User</div>
                    <button className="modal-close" onClick={() => setShowAddUserModal(false)}>×</button>
                  </div>
                  
                  <form onSubmit={handleCreateUserSubmit}>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' }}>
                      {addUserError && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '6px', padding: '10px', fontSize: '13px', textAlign: 'center' }}>
                          ❌ {addUserError}
                        </div>
                      )}

                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Ramesh Patil"
                          value={newUser.fullName}
                          onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Phone Number (with Country Code)</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. +919876500005"
                          value={newUser.phone}
                          onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email Address (Optional)</label>
                        <input 
                          type="email" 
                          className="form-input" 
                          placeholder="e.g. ramesh@example.com"
                          value={newUser.email}
                          onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">System Role</label>
                          <select 
                            className="form-select"
                            value={newUser.roleId}
                            onChange={e => {
                              const nextRoleId = e.target.value;
                              setNewUser({ 
                                ...newUser, 
                                roleId: nextRoleId,
                                fpoId: (rawRole === 'fpo_manager') ? currentUser?.fpo_id?.toString() || '1' : newUser.fpoId
                              });
                            }}
                            style={{ background: '#fff' }}
                          >
                            {rawRole === 'admin' ? (
                              <>
                                <option value="1">System Admin</option>
                                <option value="2">Farmer</option>
                                <option value="3">FPO Staff</option>
                                <option value="4">FPO Manager</option>
                                <option value="5">Aggregator</option>
                                <option value="6">Market Partner</option>
                              </>
                            ) : (
                              <option value="3">FPO Staff</option>
                            )}
                          </select>
                        </div>

                        {(newUser.roleId === '3' || newUser.roleId === '4' || newUser.roleId === '5') && (
                          <div className="form-group">
                            <label className="form-label">Linked FPO / Aggregator Hub</label>
                            {rawRole === 'fpo_manager' ? (
                              <div style={{ padding: '8px 12px', background: 'var(--surface2)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13.5px', fontWeight: '500' }}>
                                {dbFpos.find(f => f.id === currentUser?.fpo_id)?.name || 'My FPO'}
                              </div>
                            ) : (
                              <select 
                                className="form-select"
                                value={newUser.fpoId}
                                onChange={e => setNewUser({ ...newUser, fpoId: e.target.value })}
                                style={{ background: '#fff' }}
                              >
                                {dbFpos.map(fpo => (
                                  <option key={fpo.id} value={fpo.id}>{fpo.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Password / PIN</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="Enter security password"
                          value={newUser.password}
                          onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                          required 
                        />
                      </div>
                    </div>

                    <div className="form-footer" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowAddUserModal(false)} disabled={addUserLoading}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={addUserLoading} style={{ background: 'var(--green)', borderColor: 'var(--green)' }}>
                        {addUserLoading ? 'Creating...' : 'Create User'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fpos' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="section-title">FPO Network Management</h2>
              <button className="btn btn-primary" onClick={() => { setAddFpoError(''); setShowAddFpoModal(true); }}>+ Register FPO</button>
            </div>
            <div className="card">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>FPO ID</th>
                      <th>FPO Name</th>
                      <th>FPO Code</th>
                      <th>Region / District</th>
                      <th>Contact Phone</th>
                      <th>Contact Email</th>
                      <th>Parent Aggregator</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbFpos.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text3)' }}>Loading FPOs...</td>
                      </tr>
                    ) : (
                      dbFpos.map(fpo => {
                        const parentAgg = dbFpos.find(p => p.id === fpo.aggregator_id);
                        return (
                          <tr key={fpo.id}>
                            <td><strong>FPO-0{fpo.id}</strong></td>
                            <td><strong>{fpo.name}</strong></td>
                            <td><span className="badge badge-teal">{fpo.code}</span></td>
                            <td>{fpo.region || 'N/A'} / {fpo.district || 'N/A'}</td>
                            <td>{fpo.contact_phone || 'N/A'}</td>
                            <td>{fpo.contact_email || 'N/A'}</td>
                            <td>{parentAgg ? <span className="badge badge-blue">{parentAgg.name}</span> : 'None'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: '4px 10px', fontSize: '12px', minWidth: 'auto', color: 'var(--amber)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                                  onClick={() => handleEditFpoClick(fpo)}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: '4px 10px', fontSize: '12px', minWidth: 'auto', color: 'var(--red)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                  onClick={() => handleDeleteFpo(fpo.id, fpo.name)}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit FPO Modal */}
            {showEditFpoModal && (
              <div className="modal-overlay" onClick={() => setShowEditFpoModal(false)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                  <div className="modal-header">
                    <div className="modal-title">Edit FPO Organization</div>
                    <button className="modal-close" onClick={() => setShowEditFpoModal(false)}>×</button>
                  </div>
                  
                  <form onSubmit={handleEditFpoSubmit}>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' }}>
                      {editFpoError && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '6px', padding: '10px', fontSize: '13px', textAlign: 'center' }}>
                          ❌ {editFpoError}
                        </div>
                      )}

                      <div className="form-group">
                        <label className="form-label">FPO Name *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={editFpo.name}
                          onChange={e => setEditFpo({ ...editFpo, name: e.target.value })}
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">FPO Code (Unique Identifier) *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={editFpo.code}
                          onChange={e => setEditFpo({ ...editFpo, code: e.target.value })}
                          required 
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">Region / Sub-district</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={editFpo.region}
                            onChange={e => setEditFpo({ ...editFpo, region: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">District Hub</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={editFpo.district}
                            onChange={e => setEditFpo({ ...editFpo, district: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Office Contact Phone</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={editFpo.contactPhone}
                          onChange={e => setEditFpo({ ...editFpo, contactPhone: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Office Contact Email</label>
                        <input 
                          type="email" 
                          className="form-input" 
                          value={editFpo.contactEmail}
                          onChange={e => setEditFpo({ ...editFpo, contactEmail: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Parent Aggregator Cluster Point (Optional)</label>
                        <select 
                          className="form-select"
                          value={editFpo.aggregatorId}
                          onChange={e => setEditFpo({ ...editFpo, aggregatorId: e.target.value })}
                          style={{ background: '#fff' }}
                        >
                          <option value="">-- No Aggregator Parent --</option>
                          {dbFpos.map(agg => (
                            <option key={agg.id} value={agg.id}>{agg.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-footer" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowEditFpoModal(false)} disabled={editFpoLoading}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={editFpoLoading} style={{ background: 'var(--green)', borderColor: 'var(--green)' }}>
                        {editFpoLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Register FPO Modal */}
            {showAddFpoModal && (
              <div className="modal-overlay" onClick={() => setShowAddFpoModal(false)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                  <div className="modal-header">
                    <div className="modal-title">Register FPO Organization</div>
                    <button className="modal-close" onClick={() => setShowAddFpoModal(false)}>×</button>
                  </div>
                  
                  <form onSubmit={handleCreateFpoSubmit}>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' }}>
                      {addFpoError && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '6px', padding: '10px', fontSize: '13px', textAlign: 'center' }}>
                          ❌ {addFpoError}
                        </div>
                      )}

                      <div className="form-group">
                        <label className="form-label">FPO Name *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Karad Farmer Producer Org"
                          value={newFpo.name}
                          onChange={e => setNewFpo({ ...newFpo, name: e.target.value })}
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">FPO Code (Unique Identifier) *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. KARAD-FPO"
                          value={newFpo.code}
                          onChange={e => setNewFpo({ ...newFpo, code: e.target.value })}
                          required 
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">Region</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Satara"
                            value={newFpo.region}
                            onChange={e => setNewFpo({ ...newFpo, region: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">District</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Satara"
                            value={newFpo.district}
                            onChange={e => setNewFpo({ ...newFpo, district: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">Contact Phone</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. +912164223344"
                            value={newFpo.contactPhone}
                            onChange={e => setNewFpo({ ...newFpo, contactPhone: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Contact Email</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            placeholder="e.g. info@karadfpo.in"
                            value={newFpo.contactEmail}
                            onChange={e => setNewFpo({ ...newFpo, contactEmail: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Parent Aggregator Association (Optional)</label>
                        <select 
                          className="form-select"
                          value={newFpo.aggregatorId}
                          onChange={e => setNewFpo({ ...newFpo, aggregatorId: e.target.value })}
                          style={{ background: '#fff' }}
                        >
                          <option value="">None / Independent FPO</option>
                          {dbFpos.filter(f => !f.aggregator_id).map(agg => (
                            <option key={agg.id} value={agg.id}>{agg.name} ({agg.code})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-footer" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowAddFpoModal(false)} disabled={addFpoLoading}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={addFpoLoading} style={{ background: 'var(--green)', borderColor: 'var(--green)' }}>
                        {addFpoLoading ? 'Registering...' : 'Register FPO'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (() => {
          // Filter payments list dynamically inside App.jsx
          const filteredPayments = receipts.map(r => {
            const isCollateral = r.collateralStatus !== 'None';
            return {
              id: r.id,
              poRef: `PO-2026-${r.id.split('-').pop()}`,
              bank: isCollateral ? (r.pledgeBank || 'NABARD Escrow') : 'None / Direct Cash',
              value: r.value,
              status: isCollateral ? 'Settled / Funded' : 'Direct Payout Pending',
              statusClass: isCollateral ? 'badge-green' : 'badge-amber',
              date: r.date,
              dateRaw: r.dateRaw || r.issue_date
            };
          }).filter(p => {
            if (payStatus !== 'All' && p.status !== payStatus) return false;
            if (payBank !== 'All' && p.bank !== payBank) return false;
            if (paySearch.trim() !== '') {
              const q = paySearch.toLowerCase();
              if (!p.poRef.toLowerCase().includes(q) && !p.bank.toLowerCase().includes(q)) return false;
            }
            if (p.dateRaw) {
              const pDate = new Date(p.dateRaw);
              if (payFromDate) {
                const fromDate = new Date(payFromDate);
                if (pDate < fromDate) return false;
              }
              if (payToDate) {
                const toDate = new Date(payToDate);
                toDate.setHours(23, 59, 59, 999);
                if (pDate > toDate) return false;
              }
            }
            return true;
          });

          return (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 className="section-title">Purchase Order Payments & Settlements</h2>
                <div style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '4px' }}>
                  Filter and track your settlements, payouts, and escrow bank distributions.
                </div>
              </div>

              {/* Filters Top Panel */}
              <div 
                className="card" 
                style={{ 
                  padding: '16px 20px', 
                  display: 'flex', 
                  flexDirection: 'row',
                  flexWrap: 'wrap', 
                  gap: '16px', 
                  alignItems: 'center',
                  background: '#fff',
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* Search query */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text2)', textTransform: 'uppercase' }}>Search PO / Bank</label>
                  <input 
                    type="text" 
                    placeholder="Search reference..."
                    value={paySearch}
                    onChange={e => setPaySearch(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '13px',
                      border: '1px solid rgba(0, 0, 0, 0.15)',
                      borderRadius: '6px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* From Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '140px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text2)', textTransform: 'uppercase' }}>From Period</label>
                  <input 
                    type="date"
                    value={payFromDate}
                    onChange={e => setPayFromDate(e.target.value)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '13px',
                      border: '1px solid rgba(0, 0, 0, 0.15)',
                      borderRadius: '6px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* To Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '140px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text2)', textTransform: 'uppercase' }}>To Period</label>
                  <input 
                    type="date"
                    value={payToDate}
                    onChange={e => setPayToDate(e.target.value)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '13px',
                      border: '1px solid rgba(0, 0, 0, 0.15)',
                      borderRadius: '6px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Settlement Status Dropdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '180px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text2)', textTransform: 'uppercase' }}>Settlement Status</label>
                  <select 
                    value={payStatus}
                    onChange={e => setPayStatus(e.target.value)}
                    className="form-select"
                    style={{
                      padding: '6px 10px',
                      fontSize: '13px',
                      border: '1px solid rgba(0, 0, 0, 0.15)',
                      borderRadius: '6px',
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Settled / Funded">Settled / Funded</option>
                    <option value="Direct Payout Pending">Direct Payout Pending</option>
                  </select>
                </div>

                {/* Escrow Bank Dropdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '180px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text2)', textTransform: 'uppercase' }}>Escrow Bank</label>
                  <select 
                    value={payBank}
                    onChange={e => setPayBank(e.target.value)}
                    className="form-select"
                    style={{
                      padding: '6px 10px',
                      fontSize: '13px',
                      border: '1px solid rgba(0, 0, 0, 0.15)',
                      borderRadius: '6px',
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="All">All Banks</option>
                    <option value="NABARD Escrow">NABARD Escrow</option>
                    <option value="SBI Escrow">SBI Escrow</option>
                    <option value="HDFC Escrow">HDFC Escrow</option>
                    <option value="None / Direct Cash">None / Direct Cash</option>
                  </select>
                </div>

                {/* Reset Filters button */}
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', marginTop: '16px' }}>
                  {(payFromDate || payToDate || payStatus !== 'All' || payBank !== 'All' || paySearch) && (
                    <button 
                      onClick={() => {
                        setPayFromDate('');
                        setPayToDate('');
                        setPayStatus('All');
                        setPayBank('All');
                        setPaySearch('');
                      }}
                      className="btn btn-outline"
                      style={{ fontSize: '12px', padding: '6px 12px', background: '#fff' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Table Registry */}
              <div className="card">
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>PO Reference</th>
                        <th>Escrow Bank</th>
                        <th>Settlement Date</th>
                        <th>Valuation</th>
                        <th>Settlement Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>
                            No matching payment or settlement records found.
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.poRef}</strong></td>
                            <td>{p.bank}</td>
                            <td>{p.date || 'N/A'}</td>
                            <td style={{ fontWeight: '600' }}>₹{p.value.toLocaleString()}</td>
                            <td>
                              <span className={`badge ${p.statusClass}`}>{p.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </Layout>

      {/* Notifications / Alerts overlay popup */}
      {showAlertsModal && (
        <div className="modal-overlay" onClick={() => setShowAlertsModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div className="modal-title">System Alert logs</div>
              <button className="modal-close" onClick={() => setShowAlertsModal(false)}>×</button>
            </div>
            <div className="card-body">
              {highMoistureLots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)' }}>
                  All stored commodity moisture parameters conform with optimal levels.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--text2)', marginBottom: '8px' }}>
                    The following lots require processing to prevent spoilages:
                  </div>
                  {highMoistureLots.map(lot => (
                    <div
                      key={lot.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'var(--amber-light)',
                        border: '1px solid rgba(181,98,10,0.2)',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}
                    >
                      <div>
                        <strong>{lot.id}</strong> ({lot.commodity})<br />
                        <span style={{ fontSize: '11.5px', color: 'var(--text3)' }}>Location: {lot.warehouse} ({lot.zone})</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>{lot.moisture}% moisture</span>
                        <div
                          style={{ fontSize: '11px', color: 'var(--green)', cursor: 'pointer', textDecoration: 'underline', marginTop: '2px' }}
                          onClick={() => {
                            setActiveTab('grading');
                            setShowAlertsModal(false);
                          }}
                        >
                          Send to Lab &rarr;
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-footer">
              <button className="btn btn-primary" onClick={() => setShowAlertsModal(false)}>
                Acknowledge All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
