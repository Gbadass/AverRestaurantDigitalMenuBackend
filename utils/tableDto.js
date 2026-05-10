// utils/tableDto.js
export function toTableDto(table, menuUrl) {
    return {
      id: table._id.toString(),
      tableNumber: table.tableNumber,
      label: table.label,
      area: table.area,
      isActive: table.isActive,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
  
      // frontend needs this for QRCode value:
      qrUrl: `${menuUrl}/menu?table=${table._id.toString()}`,
    };
  }
  