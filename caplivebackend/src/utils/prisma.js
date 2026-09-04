const { PrismaClient } = require('@prisma/client');

const prismaRaw = new PrismaClient();

function safeParseJson(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Guard against corrupted "[object Object]" / "[object Array]" etc. from .toString()
    if (trimmed === '[object Object]' || trimmed === '[object Array]') return null;
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(value);
        return safeParseJson(parsed);
      } catch (e) {
        return value;
      }
    }
  }
  if (Array.isArray(value)) {
    return value.map(safeParseJson);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const parsedObj = {};
    for (const key of Object.keys(value)) {
      parsedObj[key] = safeParseJson(value[key]);
    }
    return parsedObj;
  }
  return value;
}

const prisma = prismaRaw.$extends({
  result: {
    installmentPlan: {
      installments: {
        needs: { installments: true },
        compute(plan) {
          return safeParseJson(plan.installments);
        }
      }
    },
    smsCampaign: {
      allowedDays: {
        needs: { allowedDays: true },
        compute(campaign) {
          return safeParseJson(campaign.allowedDays);
        }
      }
    },
    systemSetting: {
      value: {
        needs: { value: true },
        compute(setting) {
          return safeParseJson(setting.value);
        }
      }
    },
    order: {
      customerDetails: {
        needs: { customerDetails: true },
        compute(order) {
          return safeParseJson(order.customerDetails);
        }
      },
      selectedOptions: {
        needs: { selectedOptions: true },
        compute(order) {
          return safeParseJson(order.selectedOptions);
        }
      },
      installmentDetails: {
        needs: { installmentDetails: true },
        compute(order) {
          return safeParseJson(order.installmentDetails);
        }
      },
      capImages: {
        needs: { capImages: true },
        compute(order) {
          return safeParseJson(order.capImages);
        }
      }
    },
    tempOrder: {
      orderData: {
        needs: { orderData: true },
        compute(temp) {
          return safeParseJson(temp.orderData);
        }
      }
    },
    productionDispatchLog: {
      fileNames: {
        needs: { fileNames: true },
        compute(log) {
          return safeParseJson(log.fileNames);
        }
      }
    }
  }
});

module.exports = prisma;
