import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import './App.css';

export default function App({ roleKey: propRoleKey }) {
  const params = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();

  const rawRole = propRoleKey || params.roleKey || localStorage.getItem('role') || 'fpo_manager';
  const role = (rawRole === 'fpo_manager' || rawRole === 'fpo_staff') ? 'fpo' : rawRole;
  const activeTab = params.tabName || (rawRole === 'fpo_staff' ? 'farmer' : rawRole === 'farmer' ? 'farmer' : 'dashboard');

  const setRole = (newRole) => {
    localStorage.setItem('role', newRole);
    const defaultTab = newRole === 'farmer' ? 'farmer' : 'dashboard';
    navigate(`/${newRole}/${defaultTab}`);
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [dbUsers, setDbUsers] = useState([]);
  const [dbFpos, setDbFpos] = useState([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  // Mappers
  const mapLotToUI = useCallback((lot, farmers = [], commodities = [], warehouses = []) => {
    const gradeClasses = {
      grade_a: 'badge-green',
      grade_b: 'badge-amber',
      grade_c: 'badge-red',
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
    
    const farmer = farmers.find(f => f.id === lot.farmer_id);
    const commodity = commodities.find(c => c.id === lot.commodity_id);
    const warehouse = warehouses.find(w => w.id === lot.warehouse_id);

    return {
      id: lot.lot_code,
      dbId: lot.id,
      farmerId: farmer?.farmer_code || `FM-${lot.farmer_id}`,
      dbFarmerId: lot.farmer_id,
      farmerName: farmer?.name || 'Unknown Farmer',
      commodity: commodity?.name || 'Unknown Crop',
      variety: lot.variety || '',
      quantity: parseFloat(lot.quantity_kg),
      bags: lot.bag_count,
      moisture: parseFloat(lot.moisture_pct || 0),
      grade: gradeLabels[lot.grade] || lot.grade,
      gradeClass: gradeClasses[lot.grade] || 'badge-gray',
      warehouse: warehouse?.name || 'Unknown Warehouse',
      zone: lot.zone || '',
      status: statusLabels[lot.status] || lot.status,
      date: lot.intake_date ? new Date(lot.intake_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date',
      remarks: lot.remarks || ''
    };
  }, []);

  const mapDispatchToUI = useCallback((dn, lots = [], commodities = []) => {
    const statusLabels = {
      created: 'Created',
      in_transit: 'In Transit',
      delivered: 'Delivered'
    };
    
    const timeline = (dn.timeline_events || [])
      .sort((a, b) => (a.event_order || 0) - (b.event_order || 0))
      .map(event => ({
        title: event.title,
        sub: event.subtitle || new Date(event.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        done: event.is_done,
        active: event.is_active
      }));

    const lot = lots.find(l => l.id === dn.lot_id);
    const commodity = lot ? commodities.find(c => c.id === lot.commodity_id) : null;

    return {
      id: dn.dn_code,
      dbId: dn.id,
      lotId: lot?.lot_code || '',
      commodity: `${commodity?.name || dn.commodity_desc || 'Unknown'} (${lot?.variety || ''})`,
      quantity: dn.quantity_desc || `${parseFloat(dn.dispatch_quantity_kg) / 1000} MT`,
      quantityKg: parseFloat(dn.dispatch_quantity_kg),
      destination: dn.destination,
      vehicle: dn.vehicle_reg,
      status: statusLabels[dn.status] || dn.status,
      timeline: timeline.length > 0 ? timeline : [
        { title: 'Dispatch Note Created', sub: 'Just now', done: true }
      ]
    };
  }, []);

  const mapReceiptToUI = useCallback((wr, lots = [], farmers = [], commodities = [], warehouses = []) => {
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

    const lot = lots.find(l => l.id === wr.lot_id);
    const farmer = farmers.find(f => f.id === wr.farmer_id);
    const commodity = lot ? commodities.find(c => c.id === lot.commodity_id) : null;
    const warehouse = lot ? warehouses.find(w => w.id === lot.warehouse_id) : null;

    return {
      id: wr.wr_code || '',
      dbId: wr.id,
      lotId: lot?.lot_code || '',
      farmerId: farmer?.farmer_code || `FM-${wr.farmer_id}`,
      farmerName: farmer?.name || 'Unknown',
      commodity: commodity?.name || 'Unknown',
      variety: lot?.variety || '',
      quantity: parseFloat(wr.quantity_kg),
      bags: lot?.bag_count || 0,
      moisture: parseFloat(lot?.moisture_pct || 0),
      grade: gradeLabels[lot?.grade] || lot?.grade || 'QC Pending',
      value: parseFloat(wr.valuation),
      collateralStatus: pledgeStatusLabels[wr.collateral_status] || 'None',
      pledgeBank: wr.pledge_bank || '',
      loanAmount: parseFloat(wr.loan_amount || 0),
      warehouse: warehouse?.name || 'Unknown Warehouse',
      zone: lot?.zone || '',
      date: wr.issue_date ? new Date(wr.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      validity: wr.expiry_date ? new Date(wr.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
    };
  }, []);

  const loadAllData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [lotsData, dispatchesData, receiptsData, statsData, commoditiesData, warehousesData, farmersData, usersData, fposData] = await Promise.all([
        inventoryService.getLots(),
        dispatchService.getDispatches(),
        inventoryService.getReceipts(),
        dashboardService.getStats(),
        commodityService.getCommodities(),
        warehouseService.getWarehouses(),
        farmerService.getFarmers(),
        rawRole === 'admin' ? apiClient.get('/api/users/').then(r => r.data).catch(() => []) : Promise.resolve([]),
        fpoService.getFPOs().catch(() => [])
      ]);

      setDbCommodities(commoditiesData);
      setDbWarehouses(warehousesData);
      setDbFarmers(farmersData);
      setDbUsers(usersData);
      setDbFpos(fposData);

      setIntakes(lotsData.map(lot => mapLotToUI(lot, farmersData, commoditiesData, warehousesData)));
      setDispatches(dispatchesData.map(dn => mapDispatchToUI(dn, lotsData, commoditiesData)));
      setReceipts(receiptsData.map(wr => mapReceiptToUI(wr, lotsData, farmersData, commoditiesData, warehousesData)));
      
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

      if (lotRes.status !== 'returned' && lotRes.grade !== 'rejected') {
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
      alert('Failed to register intake on backend.');
    }
  };

  const handleUpdateGrade = async (lotId, grade, gradeClass, moisture, status) => {
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
        lot_id: lot.dbId,
        moisture_pct: parseFloat(moisture),
        foreign_matter_pct: 0.45,
        broken_grains_pct: 1.2,
        grade: mappedGrade,
        inspected_by: 'Govt Lab Officer',
        notes: 'AGMARK certified'
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
      alert('Failed to update quality record on backend.');
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
        vehicle_reg: newDispatch.vehicle,
        status: 'in_transit',
        dispatch_date: new Date().toISOString()
      });

      apiSim.triggerFleetbaseDispatch(newDispatch);
      await loadAllData();
    } catch (err) {
      console.error('Add dispatch failed:', err);
      alert('Failed to register dispatch on backend.');
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
      alert('Failed to apply collateral on backend.');
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

        {activeTab === 'receipts' && (
          <Receipts
            receipts={receipts}
            intakes={intakes}
            onApplyCollateral={handleApplyCollateral}
            searchQuery={searchQuery}
            language={language}
            role={role}
          />
        )}

        {(activeTab === 'market' || activeTab === 'purchase-orders') && (
          <Market
            intakes={intakes}
            onReserveLot={handleReserveLot}
            searchQuery={searchQuery}
            language={language}
            role={role}
            activeTab={activeTab}
          />
        )}

        {activeTab === 'transfers' && (
          <Transfers
            intakes={intakes}
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

        {(activeTab === 'farmer' || activeTab === 'withdrawal-requests' || activeTab === 'farmer-profile') && (
          <FarmerPortal
            intakes={intakes}
            receipts={receipts}
            farmersList={mappedFarmers}
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
                alert('Failed to amend receipt on backend.');
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
              <button className="btn btn-primary" onClick={() => alert('Feature to create new user profile')}>+ Create User</button>
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
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text3)' }}>Loading system users...</td>
                      </tr>
                    ) : (
                      dbUsers.map(usr => (
                        <tr key={usr.id}>
                          <td><strong>USR-0{usr.id}</strong></td>
                          <td>{usr.full_name}</td>
                          <td>{usr.phone}</td>
                          <td>{usr.email || 'N/A'}</td>
                          <td><span className="badge badge-teal">{usr.role}</span></td>
                          <td><span className={`badge ${usr.is_active ? 'badge-green' : 'badge-red'}`}>{usr.is_active ? 'Active' : 'Deactivated'}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fpos' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="section-title">FPO Network Management</h2>
              <button className="btn btn-primary" onClick={() => alert('Feature to create FPO profile')}>+ Register FPO</button>
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
                    </tr>
                  </thead>
                  <tbody>
                    {dbFpos.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text3)' }}>Loading FPOs...</td>
                      </tr>
                    ) : (
                      dbFpos.map(fpo => (
                        <tr key={fpo.id}>
                          <td><strong>{fpo.id}</strong></td>
                          <td>{fpo.name}</td>
                          <td><span className="badge badge-teal">{fpo.code}</span></td>
                          <td>{fpo.region} / {fpo.district}</td>
                          <td>{fpo.contact_phone || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 className="section-title">Purchase Order Payments & Settlements</h2>
            <div className="card">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>PO Reference</th>
                      <th>Escrow Bank</th>
                      <th>Valuation</th>
                      <th>Settlement Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.filter(r => r.collateralStatus !== 'None').map(r => (
                      <tr key={r.id}>
                        <td><strong>PO-2026-{r.id.split('-').pop()}</strong></td>
                        <td>{r.pledgeBank || 'NABARD Escrow'}</td>
                        <td>₹{r.value.toLocaleString()}</td>
                        <td><span className="badge badge-green">Settled / Funded</span></td>
                      </tr>
                    ))}
                    {receipts.filter(r => r.collateralStatus === 'None').map(r => (
                      <tr key={r.id}>
                        <td><strong>PO-2026-{r.id.split('-').pop()}</strong></td>
                        <td>None / Direct Cash</td>
                        <td>₹{r.value.toLocaleString()}</td>
                        <td><span className="badge badge-amber">Direct Payout Pending</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
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
