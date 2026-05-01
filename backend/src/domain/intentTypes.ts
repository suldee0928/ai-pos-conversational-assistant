export enum IntentType {
  GET_DAILY_REVENUE = "GET_DAILY_REVENUE",
  GET_CURRENT_SHIFTS = "GET_CURRENT_SHIFTS",
  COMPARE_REVENUE_PERIODS = "COMPARE_REVENUE_PERIODS",
  /** Sale.totalAmount grouped by PaymentType for one day */
  GET_REVENUE_BY_PAYMENT = "GET_REVENUE_BY_PAYMENT",
  /** Top products by SaleItem.lineTotal over a date range */
  GET_TOP_PRODUCTS = "GET_TOP_PRODUCTS",
  /** Sale totals grouped by employee over a date range */
  GET_EMPLOYEE_SALES = "GET_EMPLOYEE_SALES",
  /** Products at or below a stock threshold */
  GET_LOW_STOCK = "GET_LOW_STOCK",
  FOLLOW_UP = "FOLLOW_UP",
  UNKNOWN = "UNKNOWN"
}