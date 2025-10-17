// Google Apps Script - Code.gs
// Deploy as Web App với quyền "Anyone" để website có thể gọi

// ============================================
// CẤU HÌNH GOOGLE SHEETS
// ============================================

const SHEET_CONFIG = {
  MENU_SHEET: 'Menu',      // Sheet chứa danh sách món ăn
  ORDERS_SHEET: 'Orders'   // Sheet chứa đơn hàng
};

// ============================================
// XỬ LÝ GET REQUEST - LẤY DỮ LIỆU
// ============================================

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    if (action === 'getMenu') {
      return getMenuData();
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Invalid action'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// XỬ LÝ POST REQUEST - LƯU DỮ LIỆU
// ============================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'saveOrder') {
      return saveOrderData(data.order);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Invalid action'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// LẤY DANH SÁCH MENU
// ============================================

function getMenuData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_CONFIG.MENU_SHEET);
  
  // Tạo sheet Menu nếu chưa có
  if (!sheet) {
    sheet = createMenuSheet(ss);
  }
  
  const data = sheet.getDataRange().getValues();
  
  // Bỏ qua header (dòng đầu tiên)
  const menu = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Bỏ qua dòng trống
    if (!row[0]) continue;
    
    menu.push({
      id: row[0],
      name: row[1],
      description: row[2],
      price: row[3],
      image: row[4]
    });
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      menu: menu
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// LƯU ĐƠN HÀNG
// ============================================

function saveOrderData(order) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_CONFIG.ORDERS_SHEET);
  
  // Tạo sheet Orders nếu chưa có
  if (!sheet) {
    sheet = createOrdersSheet(ss);
  }
  
  // Format items thành string
  const itemsStr = order.items.map(item => 
    `${item.name} x${item.quantity}`
  ).join(', ');
  
  // Thêm dòng mới
  sheet.appendRow([
    new Date(order.timestamp),
    order.orderId,
    order.customer.name,
    order.customer.phone,
    order.customer.address,
    itemsStr,
    order.subtotal,
    order.shippingFee,
    order.distance,
    order.total,
    order.note || '',
    'Mới' // Trạng thái
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Order saved successfully'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// TẠO SHEET MẪU
// ============================================

function createMenuSheet(ss) {
  const sheet = ss.insertSheet(SHEET_CONFIG.MENU_SHEET);
  
  // Tạo header
  const headers = ['ID', 'Tên món', 'Mô tả', 'Giá', 'Hình ảnh (URL)'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#dc3545');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  
  // Dữ liệu mẫu
  const sampleData = [
    [1, 'Phở Bò Đặc Biệt', 'Phở bò với đầy đủ thịt, gân, sách', 45000, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400'],
    [2, 'Cơm Tấm Sườn Bì', 'Cơm tấm với sườn nướng và bì', 40000, 'https://images.unsplash.com/photo-1596040033229-a0b0c9b7a6e7?w=400'],
    [3, 'Bánh Mì Thịt Nướng', 'Bánh mì giòn với thịt nướng thơm ngon', 25000, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400'],
    [4, 'Bún Bò Huế', 'Bún bò Huế cay nồng đậm đà', 42000, 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400'],
    [5, 'Gỏi Cuốn Tôm Thịt', '5 cuốn gỏi cuốn tươi ngon với tôm và thịt', 35000, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400'],
    [6, 'Trà Sữa Trân Châu', 'Trà sữa ngọt ngào với trân châu dai', 28000, 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400']
  ];
  
  sheet.getRange(2, 1, sampleData.length, 5).setValues(sampleData);
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  return sheet;
}

function createOrdersSheet(ss) {
  const sheet = ss.insertSheet(SHEET_CONFIG.ORDERS_SHEET);
  
  // Tạo header
  const headers = [
    'Thời gian',
    'Mã đơn',
    'Tên khách',
    'SĐT',
    'Địa chỉ',
    'Món ăn',
    'Tiền món',
    'Phí ship',
    'Khoảng cách (km)',
    'Tổng tiền',
    'Ghi chú',
    'Trạng thái'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#dc3545');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  return sheet;
}

// ============================================
// KHỞI TẠO SHEETS (Chạy thủ công lần đầu)
// ============================================

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Tạo sheet Menu
  if (!ss.getSheetByName(SHEET_CONFIG.MENU_SHEET)) {
    createMenuSheet(ss);
  }
  
  // Tạo sheet Orders
  if (!ss.getSheetByName(SHEET_CONFIG.ORDERS_SHEET)) {
    createOrdersSheet(ss);
  }
  
  Logger.log('Sheets setup completed!');
}