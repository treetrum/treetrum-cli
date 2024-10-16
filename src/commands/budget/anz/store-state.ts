// Generated by https://quicktype.io

export interface Store {
    getState: () => StoreState;
    subscribe: (cb: () => void) => () => void;
}

export interface StoreState {
    login: Login;
    returnedItems: ReturnedItems;
    returnedItemsAccounts: ReturnedItemsAccounts;
    registration: PuneHedgehog;
    manageBillers: Manage;
    billerlist: Billerlist;
    billsNotifications: BillsNotifications;
    previousBills: PreviousBills;
    billUpdateNotify: BillUpdateNotify;
    cardList: WrappingKey;
    menuItems: PuneHedgehog;
    accountSummary: AccountSummary;
    userInfo: WrappingKey;
    selectedCard: WrappingKey;
    generateOTP: WrappingKey;
    verifyOTP: WrappingKey;
    WrappingKey: WrappingKey;
    referenceDetails: ReferenceDetails;
    genReferenceDetails: ReferenceDetails;
    renameAccountDetails: AccountSummary;
    blockUI: BlockUI;
    resetTime: ResetTime;
    feedback: ConsentFormRequest;
    serviceError: WrappingKey;
    headerValues: HeaderValues;
    productData: { [key: string]: null };
    businessProductsData: { [key: string]: null };
    personalProductsData: { [key: string]: null };
    aopOfferData: AOPOfferData;
    taxInvoiceDetails: WrappingKey;
    cheque: Cheque;
    managePayees: ManagePayees;
    activateRSAData: ActivateRSAData;
    mleRename: AddIntPayeeEnteredBranchCode;
    payAnyoneData: ArakGroundhog;
    dlpData: DLPData;
    payAnyoneAccountDetails: ArakGroundhog;
    superAnnuationTokenData: SuperAnnuationTokenData;
    accountOverview: AccountOverview;
    interestChargesLoad: InterestChargesLoad;
    panAddPayeeData: ArakGroundhog;
    panEditPayeeData: ArakGroundhog;
    fundTransferFromAccounts: ArakGroundhog;
    fundTransferToAccounts: ArakGroundhog;
    getBankAccountOffers: { [key: string]: null };
    homeAccountSummary: AccountSummary;
    codeReferenceDetails: ArakGroundhog;
    submitFTRequest: ArakGroundhog;
    employeeData: EmployeeData;
    handleAuditInfo: WrappingKey;
    cancelSetPinInfo: WrappingKey;
    statementPreferences: PuneHedgehog;
    bpayFromAccounts: ArakGroundhog;
    bpayInitiatePmtData: ArakGroundhog;
    panInitiatePmtData: ArakGroundhog;
    notificationsData: ArakGroundhog;
    resolvePayID: ArakGroundhog;
    manageIntPayee: ManageIntPayee;
    context: ArakGroundhog;
    riskAssessmentData: RiskAssessmentData;
    interstitialData: PuneHedgehog;
    putInterstitialData: ArakGroundhog;
    putCrsInterstitialData: ArakGroundhog;
    entityList: ArakGroundhog;
    productsOffersData: ProductsOffersData;
    registerPayone: RegisterPayone;
    viewStatements: DownloadLetterReducer;
    downloadLetterReducer: DownloadLetterReducer;
    fileUploadData: ArakGroundhog;
    homeBannerDetails: AccountSummary;
    viewAuthorisePaymentsData: ViewAuthorisePaymentsData;
    tdInterestData: TdInterestData;
    serviceRequest: ContactPage;
    historyDetail: ContactPage;
    creditRewardPoints: ArakGroundhog;
    ScheduledPaymentsData: ArakGroundhog;
    viewFundTransferDetails: ArakGroundhog;
    skipUnskipDeleteDetails: SkipUnskipDeleteDetails;
    multiTransfer: MultiTransfer;
    editFundTransfer: ArakGroundhog;
    repairPaymentsList: ArakGroundhog;
    MultiBPay: MultiBPay;
    bpayAdhocbillerCapturedData: BpayAdhocbillerCapturedData;
    srType: SrType;
    editBpay: ArakGroundhog;
    payEmployeesReducer: PayEmployeesReducer;
    multiPayAnyOneAccountDetails: ArakGroundhog;
    multiPayAnyOneListPayeeData: ArakGroundhog;
    mPayInitiatePmtData: ArakGroundhog;
    mpayAnyoneData: ArakGroundhog;
    paymentIncompleteFlag: PaymentIncompleteFlag;
    searchPastPaymentsTransactions: SearchPastPaymentsTransactions;
    viewPastpaymentDetails: ArakGroundhog;
    saveAsTemplate: ArakGroundhog;
    fetchTemplateDetails: ArakGroundhog;
    uploadPayAnyoneData: ArakGroundhog;
    orderCheqDepBookData: OrderCheqDepBookData;
    pastPaymentsList: ArakGroundhog;
    viewRepairPaymentsData: ViewRepairPaymentsData;
    anzShieldCodeData: AnzShieldCodeData;
    secureMail: SecureMail;
    secureMailFundsTransfer: SecureMailFundsTransfer;
    secureMailPayAnyone: SecureMailPayAnyone;
    fundTransPayAnyoneEnqDetails: FundTransPayAnyoneEnqDetails;
    internationalMoneyTransfer: InternationalMoneyTransfer;
    resetPassword: ArakGroundhog;
    shareInvestData: PuneHedgehog;
    purchaseForeignCurrency: PurchaseForeignCurrency;
    updateEmail: UpdateEmail;
    donateCharity: DonateCharity;
    customerViewMessage: CustomerViewMessage;
    manageUsers: ManageUsers;
    credentialRecovery: CredentialRecovery;
    mpaySubmitDataToAPI: ArakGroundhog;
    bpayFlowType: BpayFlowType;
    multiPayFlowType: ArakGroundhog;
    singlePayFlowType: ArakGroundhog;
    singleFundFlowType: BpayFlowType;
    purchaseChequeFlowType: ArakGroundhog;
    imtadhocpayeeData: ImtadhocpayeeData;
    imtPayeeData: ImtPayeeData;
    genericOfferData: GenericOfferData;
    userAddress: ArakGroundhog;
    contactPage: ContactPage;
    paymentTemplateList: PaymentTemplateList;
    maintainLinkedAccounts: MaintainLinkedAccounts;
    offerfulfillmentData: ArakGroundhog;
    MaintainProfileAndLinkagesReducer: PuneHedgehog;
    payTaxationOfficeReducer: PayTaxationOfficeReducer;
    purchaseChequeAccountDetails: ArakGroundhog;
    purchaseChequeInitiatePmtData: ArakGroundhog;
    CreateDirectDebitBatchReducer: CreateDirectDebitBatchReducer;
    payId: PayID;
    managePayId: ManagePayID;
    BankFeedReducer: PuneHedgehog;
    PccAccounts: PccAccounts;
    CreditLimitIncreaseData: CreditLimitIncreaseData;
    CreditCardBalTransfer: CreditCardBALTransfer;
    manageNotificationData: ManageNotificationData;
    manageClients: Manage;
    viewActivityLogs: ViewActivityLogs;
    changeContactDetails: ChangeContactDetails;
    tilesPage: TilesPage;
    directDebFileData: ArakGroundhog;
    eSecurityQuestions: ArakGroundhog;
    errorBoundaries: ErrorBoundaries;
    anzTermDeposit: AnzTermDeposit;
    HomeLoanContact: HomeLoanContact;
    payToAgreements: PayToAgreements;
    dataSharingDashboardData: DataSharingDashboardData;
    outageInfo: OutageInfo;
    productsRates: ArakGroundhog;
    rofcheckstatus: ArakGroundhog;
    ConsentFormRequest: ConsentFormRequest;
    reportList: ReportList;
    ContactReqFormData: ContactReqFormData;
    fetchCustomerAddress: ArakGroundhog;
    plTopupAcquisitionData: PlTopupAcquisitionData;
    qantasFrequentFlyerFormData: QantasFrequentFlyerFormData;
    profileInquiry: ContactPage;
    livingExpensesData: LivingExpensesData;
    featureToggleData: ArakGroundhog;
    addIntPayeeEnteredBranchCode: AddIntPayeeEnteredBranchCode;
}

export interface PuneHedgehog {
    data: PurpleData | null | string;
    status: string;
    error: boolean | null | string;
    isOaamDown?: boolean;
}

export interface PurpleData {
    data: FluffyData;
    status?: number;
    statusText?: string;
    headers?: Headers;
    config?: DataConfig;
    request?: ContactPage;
    "jwt-Token"?: string;
    channelContext?: ChannelContext | null;
}

export interface ChannelContext {
    status: Status;
    pagination: Pagination;
}

export interface Pagination {
    hasMoreRecords: string;
    numRecReturned: string;
}

export interface Status {
    message: Message[];
}

export interface Message {
    message_TYPE: string;
    messageDesc: string;
    messageCode: string;
}

export interface DataConfig {
    transitional: Transitional;
    transformRequest: null[];
    transformResponse: null[];
    timeout: number;
    xsrfCookieName: string;
    xsrfHeaderName: string;
    maxContentLength: number;
    maxBodyLength: number;
    headers: { [key: string]: string };
    baseURL: string;
    url: string;
    method: string;
}

export interface Transitional {
    silentJSONParsing: boolean;
    forcedJSONParsing: boolean;
    clarifyTimeoutError: boolean;
}

export interface FluffyData {
    "jwt-Token"?: string;
    data?: TentacledData;
    channelContext?: null;
    cutomerShortName?: string;
    suspensionFlag?: string;
    lockStatus?: string;
    customerStatus?: string;
    userType?: string;
    eSecurityStatus?: string;
    rsaStatus?: string;
    shieldStatus?: string;
    mid?: string;
    lastLoginDate?: string;
    emailId?: string;
    custClass?: string;
    testMode?: string;
    fixedTestDate?: string;
    isYMRMaskedFlag?: string;
    isLoanTextchangeFlag?: string;
    accessScheme?: string;
    anzSIStatus?: string;
    acctFlag?: string;
    isOAAMAvailable?: string;
    isShieldAvailable?: string;
    shieldReRegistrationRequired?: string;
    mfaRegStatus?: string;
    isShieldInheritedFromAccess?: string;
    profiles?: DataProfile[];
    dataSharingFeatureEnabled?: string;
    biometricConsentFlag?: string;
    isProjectWarrenRolledout?: string;
    openBankingMaskRemovePayAnyoneEnabled?: string;
    mpsEligibilityFlag?: string;
    isProjAccordMasked?: string;
    isNegativeFundsEnabledForDDA?: string;
    isAccountLevelOfferAvailable?: string;
    PUID?: string;
    hashedEmail?: string;
    isCSOProxyLogin?: string;
    outageExpiryTime?: number;
    outageInfo?: unknown[];
}

export interface TentacledData {
    interstitialType: InterstitialType;
    interstitialSrNum: number;
    interstitialData: ContactPage;
}

export type ContactPage = unknown;

export interface InterstitialType {
    codeType: string;
}

export interface DataProfile {
    userType: string;
    relationship: string;
    linkingIndex: string;
}

export interface Headers {
    "access-control-allow-origin": string;
    "cache-control": string;
    "content-length": string;
    "content-type": string;
    expires: string;
    pragma: string;
    "x-anz-nonce": string;
    "x-anz-serverdate": string;
}

export interface ConsentFormRequest {
    error: boolean;
    status: string;
}

export interface ContactReqFormData {
    contactreqformData: null;
    status: null;
}

export interface CreateDirectDebitBatchReducer {
    data: null;
    initateDirectDebit: ArakGroundhog;
    error: string;
    status: string;
    selectedItem: ContactPage;
    flowType: FlowType;
    directdebitsFileData: ContactPage;
    addTemplateArray: ContactPage;
}

export interface FlowType {
    refId: null | string;
    flow: null | string;
}

export interface ArakGroundhog {
    data: IndigoData | null;
    error: boolean | null;
    status: string;
    transMode?: string;
    transactionMode?: string;
    apiStatus?: string;
    from?: string;
    accountnotifications?: Accountnotifications;
    transType?: string;
    fetchMode?: string;
}

export interface Accountnotifications {
    data: AccountnotificationsData;
    status: number;
    statusText: string;
    headers: Headers;
    config: AccountnotificationsConfig;
    request: ContactPage;
}

export interface AccountnotificationsConfig {
    transitional: Transitional;
    transformRequest: null[];
    transformResponse: null[];
    timeout: number;
    xsrfCookieName: string;
    xsrfHeaderName: string;
    maxContentLength: number;
    maxBodyLength: number;
    headers: { [key: string]: string };
    baseURL: string;
    url: string;
    method: string;
    data: string;
}

export interface AccountnotificationsData {
    jwtToken: null;
    data: StickyData;
    channelContext: null[];
}

export interface StickyData {
    notificationDetails: null;
    authenticationDetails: AuthenticationDetails;
}

export interface AuthenticationDetails {
    custClass: string;
    isProjectWarrenRolledout: string;
    cutomerShortName: string;
    suspensionFlag: string;
    fixedTestDate: string;
    isOAAMAvailable: string;
    mid: string;
    emailId: string;
    lastLoginDate: string;
    isYMRMaskedFlag: string;
    shieldStatus: string;
    mpsEligibilityFlag: string;
    customerStatus: string;
    acctFlag: string;
    isProjAccordMasked: string;
    lockStatus: string;
    menuEntitlement: MenuEntitlement[];
    dataSharingFeatureEnabled: string;
    activeUUID: string;
    activeCRN: string;
    rsaStatus: string;
    isShieldInheritedFromAccess: string;
    eSecurityStatus: string;
    biometricConsentFlag: string;
    isAccountLevelOfferAvailable: string;
    accessScheme: string;
    profiles: AuthenticationDetailsProfile[];
    shieldReRegistrationRequired: string;
    isLoanTextchangeFlag: string;
    mfaRegStatus: string;
    isShieldAvailable: string;
    isNegativeFundsEnabledForDDA: string;
    testMode: string;
    userType: string;
    anzSIStatus: string;
    openBankingMaskRemovePayAnyoneEnabled: string;
}

export interface MenuEntitlement {
    menuId: string;
    menuText: string;
}

export interface AuthenticationDetailsProfile {
    userType: string;
    relationship: string;
    uuid: string;
    crn: string;
    linkingIndex: string;
}

export interface IndigoData {
    "jwt-Token"?: string;
    data?: IndecentData;
    channelContext?: ChannelContext;
    "DATASHARING_ACTIVITY_LOGS.enabled"?: string;
    "adhoc_international_payee.enabled"?: string;
    "data_prefill_service.enabled"?: string;
    "policy_quote_summary.enabled"?: string;
}

export interface IndecentData {
    cutomerShortName: string;
    suspensionFlag: string;
    lockStatus: string;
    customerStatus: string;
    userType: string;
    eSecurityStatus: string;
    rsaStatus: string;
    shieldStatus: string;
    mid: string;
    lastLoginDate: string;
    emailId: string;
    custClass: string;
    testMode: string;
    fixedTestDate: string;
    isYMRMaskedFlag: string;
    isLoanTextchangeFlag: string;
    accessScheme: string;
    anzSIStatus: string;
    acctFlag: string;
    isOAAMAvailable: string;
    isShieldAvailable: string;
    shieldReRegistrationRequired: string;
    mfaRegStatus: string;
    isShieldInheritedFromAccess: string;
    profiles: DataProfile[];
    menuEntitlement?: MenuEntitlement[];
    dataSharingFeatureEnabled: string;
    biometricConsentFlag: string;
    isProjectWarrenRolledout: string;
    openBankingMaskRemovePayAnyoneEnabled: string;
    mpsEligibilityFlag: string;
    isProjAccordMasked: string;
    isNegativeFundsEnabledForDDA: string;
    isAccountLevelOfferAvailable: string;
    PUID: string;
    hashedEmail: string;
    isCSOProxyLogin?: string;
}

export interface CreditCardBALTransfer {
    Fromlist: ArakGroundhog;
    toList: ArakGroundhog;
    ccBalanceTransfer: ArakGroundhog;
    tempCcBalanceTrans: ArakGroundhog;
}

export interface CreditLimitIncreaseData {
    initiateData: ArakGroundhog;
    requestData: ArakGroundhog;
    statusData: ArakGroundhog;
    referenceData: ReferenceData;
}

export interface ReferenceData {
    occupationList: unknown[];
    phoneTypeList: unknown[];
    employmentList: unknown[];
    housingList: unknown[];
    termList: unknown[];
    loanList: unknown[];
    incomeList: unknown[];
}

export interface HomeLoanContact {
    HomeLoanData: null;
    status: null;
}

export interface MultiBPay {
    flowType: FlowType;
    templateData: ArakGroundhog;
    tempList: ArakGroundhog;
    fromAccountList: ArakGroundhog;
    createTemplate: ArakGroundhog;
    viewTemplate: ArakGroundhog;
}

export interface PccAccounts {
    fromAccounts: ArakGroundhog;
    toAccounts: ArakGroundhog;
    pccData: ArakGroundhog;
    pccFlow: FlowType;
}

export interface WrappingKey {
    data: null;
    error: boolean;
}

export interface AccountOverview {
    transaction: Transaction;
    outstandingAuth: AccountOverviewOutstandingAuth;
    interestCharges: InterestCharges;
    interestChargesSummary: InterestChargesSummary;
    interestAccountData: InterestAccountData;
    merchantTransactionsData: PuneHedgehog;
    accountActions: AccountActions;
    status: string;
    accountDetailsSummary: null;
    transactionHisDownload: null;
    credit: Credit;
    accountSearchFilter: AccountSearchFilter;
}

export interface AccountActions {
    actionsList: ActionsList | null;
    aStatus: string;
    aError: string;
}

export interface ActionsList {
    "jwt-Token": string;
    data: ActionsListData;
    channelContext: ChannelContext;
}

export interface ActionsListData {
    accountId: string;
    functionsList: FunctionsList[];
}

export interface FunctionsList {
    functionalityId: string;
    functionalityDescription: string;
}

export interface AccountSearchFilter {
    filteredAccounts: null;
    status: string;
    error: string;
}

export interface Credit {
    statementList: StatementList | null;
    transList: null;
    loading: boolean;
    tranStatus: string;
    statStatus: string;
    statError: string;
    statJWTFlag: boolean;
}

export interface StatementList {
    "jwt-Token": string;
    data: StatementListData;
    channelContext: null;
}

export interface StatementListData {
    accountId: string;
    cardAccountNumber: string;
    accountType: AccountCurrency;
    statementCycles: StatementCycle[];
}

export interface AccountCurrency {
    codeType: string;
    cmCode: string;
    codeDescription: string;
}

export interface StatementCycle {
    totalCreditLimit: AmountDetails;
    availableCreditLimit: AmountDetails;
    totalAmountDue: TransactionBalance;
    minimumAmountDue: TransactionBalance;
    openingBalance: AmountDetails;
    overdueLimit: TransactionBalance;
    closingBalance: AmountDetails;
    paymentDueDate: string;
    startDate: string;
    endDate: string;
}

export interface AmountDetails {
    amount: number;
    currency: string;
}

export interface TransactionBalance {
    amount: number;
}

export interface InterestAccountData {
    accountData: null;
    status: string;
    error: string;
}

export interface InterestCharges {
    interestData: null;
    iStatus: string;
    iError: string;
}

export interface InterestChargesSummary {
    interestsummaryData: null;
    status: string;
    error: string;
}

export interface AccountOverviewOutstandingAuth {
    authList: AuthList;
    oStatus: string;
}

export interface AuthList {
    "jwt-Token": string;
    data: AuthListData;
    channelContext: null;
}

export interface AuthListData {
    accountId: string;
    parentAccountType: AccountCurrency;
    transactionList: PurpleTransactionList[];
}

export interface PurpleTransactionList {
    amountType: string;
    transactionAmount: AmountDetails;
    transactionRemarks: string;
    transactionBalance: TransactionBalance;
    transactionDate: string;
    cardUsed: string;
    originator: string;
}

export interface Transaction {
    historyList: HistoryList | null;
    tStatus: string;
    tError: string;
}

export interface HistoryList {
    "jwt-Token": string;
    data: HistoryListData;
    channelContext: ChannelContext;
}

export interface HistoryListData {
    transactionList: FluffyTransactionList[];
}

export interface FluffyTransactionList {
    accountId: string;
    cardUsed: string;
    effectiveDate: string;
    isRecentTxn: string;
    mainAccountType: AccountCurrency;
    postedDate: string;
    transactionAmount: AmountDetails;
    transactionAmountType: AccountCurrency;
    transactionDate: string;
    transactionOrigin: TransactionOrigin;
    transactionRemarks: string;
    transactionType: AccountCurrency;
}

export interface TransactionOrigin {
    codeType: string;
    cmCode: string;
}

export interface AccountSummary {
    data: AccountDetails | null;
    error: boolean;
    status: string;
    refreshFlag: boolean;
    reorderRenameSucess: boolean;
    accountLinakgeNumber: string;
    accountDetails?: AccountDetails;
}

export interface AccountDetails {
    "jwt-Token": string;
    data: SelectedAccount[];
    channelContext: null;
}

export interface SelectedAccount {
    accountId: string;
    accountName: string;
    accountNickName: null;
    accountCurrency: AccountCurrency;
    parentAccountType: AccountCurrency;
    accountType: AccountCurrency;
    branchCode: string;
    balances: Balance[];
    accountLinkageNumber: number;
}

export interface Balance {
    type: string;
    amountDetails: AmountDetails;
}

export interface ActivateRSAData {
    serialNumber: string;
    data: null;
    status: string;
}

export interface AddIntPayeeEnteredBranchCode {
    data: null | string;
    status: string;
}

export interface AnzShieldCodeData {
    data: string;
    status: string;
    error: string;
    mfaRequest: MfaRequest;
    thresholdValue: string;
    shieldRegisterFlag: string;
}

export interface MfaRequest {
    type: null;
    entryPoint: null;
}

export interface AnzTermDeposit {
    add: ArakGroundhog;
    TermDepositData: null;
    TermDepositReviewData: null;
    AdvTermDepositData: null;
    AdvTermDepositReviewData: null;
    BTermDepositData: null;
    BTermDepositReviewData: null;
    errorType: null;
}

export interface AOPOfferData {
    accessAdvantageOfferData: null;
    progressSaverOfferData: null;
    onlineSaverOfferData: null;
}

export interface BillUpdateNotify {
    status: string;
    eventType: string;
    error: ContactPage;
}

export interface Billerlist {
    list: ArakGroundhog;
    billersAddData: ArakGroundhog;
    billerCodeList: ArakGroundhog;
    billersSubmitData: ArakGroundhog;
    billersDataEdit: ArakGroundhog;
    billerDeactivateData: ArakGroundhog;
}

export interface BillsNotifications {
    bills: unknown[];
    notifications: unknown[];
    billerDetails: unknown[];
    status: string;
}

export interface BlockUI {
    blocking: boolean;
    containerBlock: boolean;
}

export interface BpayAdhocbillerCapturedData {
    adhocBillerData: null;
}

export interface BpayFlowType {
    flowType: null;
    refId: null;
}

export interface ChangeContactDetails {
    data: string;
}

export interface Cheque {
    chequeList: null;
    accountList: null;
    status: string;
    addChequeResponse: string;
    deleteChequeResponse: string;
}

export interface CredentialRecovery {
    credentialRecovery: PuneHedgehog;
    pwdResetData: PuneHedgehog;
}

export interface CustomerViewMessage {
    deleteMessage: PuneHedgehog;
    getListMessage: PuneHedgehog;
    getMessage: PuneHedgehog;
    replyMessage: PuneHedgehog;
    refreshstate: boolean;
}

export interface DataSharingDashboardData {
    authorisationsList: PuneHedgehog;
    scopeList: PuneHedgehog;
    stopSharingArrangementData: PuneHedgehog;
    dataSharingHistoryData: PuneHedgehog;
    ActivityLogsData: PuneHedgehog;
}

export interface DLPData {
    status: string;
    dlpList: null;
    fromAccountsList: null;
    validateModeData: null;
    addFormData: null;
    confirmModeData: null;
}

export interface DonateCharity {
    charityDetails: ArakGroundhog;
    selectedCharity: null;
}

export interface DownloadLetterReducer {
    eligibleAccounts: ArakGroundhog;
    statementList: ArakGroundhog;
    letterList: ArakGroundhog;
    downloadStatements: ArakGroundhog;
    downloadLetters: ArakGroundhog;
}

export interface EmployeeData {
    employeeAddData: null;
    addStatus: string;
    employeeList: null;
    listStatus: string;
    employeeDeleteData: null;
    deleteStatus: string;
    employeeName: string;
}

export interface ErrorBoundaries {
    hasError: boolean;
    error: null;
    errorInfo: null;
}

export interface FundTransPayAnyoneEnqDetails {
    enquiryDetails: null;
    payAnyoneIssues: null;
    fundTransferIssues: null;
    payAnyoneDetails: null;
    fundTransferDetails: null;
}

export interface ReferenceDetails {
    data: null;
    error: boolean;
    status: string;
    countryNameList: null;
    countryCodeList: null;
    CodeList: null;
    stateList: null;
    countryReferCode: null;
    purposeList: null;
    transactionDurationData: null;
    PropRef: null;
    referenceNPayments: string;
    genericRefData?: null;
}

export interface GenericOfferData {
    genericOfferData: null;
    status: null;
}

export interface HeaderValues {
    nonce: string;
    sessionId: string;
    ctsId: string;
    domain: string;
    jwtToken: string;
    serverDate: string;
    testDate: string;
    isAccountoverviewOutage: boolean;
    outageAccountoverviewMessage: string;
    selectedAccount: SelectedAccount;
    searchData: string;
    isSearchPage: boolean;
}

export interface ImtPayeeData {
    ImtPayeeData: null;
}

export interface ImtadhocpayeeData {
    adhocPayeeData: null;
}

export interface InterestChargesLoad {
    transaction: Transaction;
    outstandingAuth: InterestChargesLoadOutstandingAuth;
    interestCharges: InterestCharges;
    interestChargesSummary: InterestChargesSummary;
    interestAccountData: InterestAccountData;
    merchantTransactionsData: PuneHedgehog;
    accountActions: AccountActions;
    status: string;
    accountDetailsSummary: null;
    transactionHisDownload: null;
    credit: Credit;
    accountSearchFilter: AccountSearchFilter;
}

export interface InterestChargesLoadOutstandingAuth {
    authList: null;
    oStatus: string;
    oError: string;
}

export interface InternationalMoneyTransfer {
    getCurrency: ArakGroundhog;
    getRates: ArakGroundhog;
    InitiateImt: ArakGroundhog;
    imtTimer: ImtTimer;
    imtFlow: BpayFlowType;
}

export interface ImtTimer {
    startFlag: boolean;
    stopFlag: boolean;
}

export interface LivingExpensesData {
    livingExpenses: null;
}

export interface Login {
    data: string;
    error: string;
    status: string;
    resetChallengeQuestions: ContactPage;
    contextData: ContactPage;
    reverseSSO: boolean;
    userType: string;
    isAccessCRN: string;
}

export interface MaintainLinkedAccounts {
    linkedAccounts: ArakGroundhog;
    initiate: ArakGroundhog;
    confirmation: ArakGroundhog;
}

export interface Manage {
    list: ArakGroundhog;
    add: ArakGroundhog;
    edit: ArakGroundhog;
    delete: ArakGroundhog;
}

export interface ManageIntPayee {
    list: ArakGroundhog;
    add: ArakGroundhog;
    edit: ArakGroundhog;
    delete: ArakGroundhog;
    branchDetails: ArakGroundhog;
    validate: ArakGroundhog;
}

export interface ManageNotificationData {
    subscriptions: ArakGroundhog;
    suspendSubscriptions: ArakGroundhog;
    selectedContactGetStartedDetails: SelectedContactGetStartedDetails;
    submitNotificationResponse: ArakGroundhog;
    changeNotificationPreference: ArakGroundhog;
    selectedPayeeListGetStartedDetails: SelectedPayeeListGetStartedDetails;
    selectedPayeeIdGetStartedDetails: SelectedPayeeIDGetStartedDetails;
    flowName: string;
}

export interface SelectedContactGetStartedDetails {
    contactDetails: null;
}

export interface SelectedPayeeIDGetStartedDetails {
    payeeId: string;
}

export interface SelectedPayeeListGetStartedDetails {
    payeeList: string;
}

export interface ManagePayID {
    managePayIdData: PuneHedgehog;
    token: null;
    duplicatePayIdData: PuneHedgehog;
}

export interface ManagePayees {
    list: ManagePayeesList;
    add: ManagePayeesAdd;
    edit: ManagePayeesEdit;
    delete: Delete;
    nick: Nick;
}

export interface ManagePayeesAdd {
    addPayeeFormData: null;
    addData: null;
    astatus: string;
    aerror: boolean;
    nickname: string;
}

export interface Delete {
    deleteData: null;
    dstatus: string;
    derror: boolean;
}

export interface ManagePayeesEdit {
    editData: null;
    estatus: string;
    eerror: boolean;
}

export interface ManagePayeesList {
    listData: null;
    lstatus: string;
    lerror: boolean;
}

export interface Nick {
    nickData: null;
    nstatus: string;
    nerror: null;
}

export interface ManageUsers {
    list: ManageUsersList;
    add: ManageUsersAdd;
    delete: ArakGroundhog;
    edit: ManageUsersEdit;
    editGet: ArakGroundhog;
    newPwd: ArakGroundhog;
    editAdminData: ArakGroundhog;
    editSaveData: ArakGroundhog;
}

export interface ManageUsersAdd {
    addData: null;
    status: string;
}

export interface ManageUsersEdit {
    editData: null;
    status: string;
}

export interface ManageUsersList {
    listData: PuneHedgehog;
    tableData: PuneHedgehog;
}

export interface MultiTransfer {
    flowType: FlowType;
    tempList: ArakGroundhog;
}

export interface OrderCheqDepBookData {
    fromAccounts: ArakGroundhog;
    orderbook: ArakGroundhog;
}

export interface OutageInfo {
    outage: PuneHedgehog;
}

export interface PayEmployeesReducer {
    payrollFileData: ContactPage;
    flowType: FlowType;
    fromAccounts: ArakGroundhog;
    initiatePayRoll: ArakGroundhog;
    saveTemplateData: ArakGroundhog;
    ViewTemplate: ArakGroundhog;
    employeesTempList: ArakGroundhog;
}

export interface PayID {
    steps: string[];
    reload: boolean;
}

export interface PayTaxationOfficeReducer {
    fromAccounts: ArakGroundhog;
    payment: ArakGroundhog;
    flowData: FlowType;
    flowType: FlowType;
}

export interface PayToAgreements {
    mandateList: ArakGroundhog;
    mandateDetails: ArakGroundhog;
    mandateDecline: ArakGroundhog;
    mandateAmend: ArakGroundhog;
    mandateId: null;
    acceptActions: ArakGroundhog;
    changeStatus: ArakGroundhog;
}

export interface PaymentIncompleteFlag {
    status: boolean;
    message: string;
}

export interface PaymentTemplateList {
    list: ArakGroundhog;
    delete: ArakGroundhog;
    renameTemplate: ArakGroundhog;
    addedTemplateDetails: ArakGroundhog;
    fetchedTemplateDetails: ArakGroundhog;
    editedTemplateDetails: ArakGroundhog;
}

export interface PlTopupAcquisitionData {
    plTopupAcquisitionData: null;
    status: null;
}

export interface PreviousBills {
    bills: unknown[];
    status: string;
    error: ContactPage;
}

export interface ProductsOffersData {
    productsOffersData: null;
    status: null;
}

export interface PurchaseForeignCurrency {
    fromAccountList: ArakGroundhog;
    currencyList: ArakGroundhog;
    tableList: ArakGroundhog;
    submitPfcResponse: ArakGroundhog;
    getCalculatedAmount: ArakGroundhog;
}

export interface QantasFrequentFlyerFormData {
    QantasFrequentFlyerData: null;
    status: null;
}

export interface RegisterPayone {
    list: ArakGroundhog;
    add: ArakGroundhog;
    putInt: ArakGroundhog;
    delete: ArakGroundhog;
    changeLimit: ArakGroundhog;
    deleteInternationlService: ArakGroundhog;
}

export interface ReportList {
    reportList: ArakGroundhog;
    viewReports: ArakGroundhog;
}

export interface ResetTime {
    resetTimeFlag: boolean;
}

export interface ReturnedItems {
    accounts: ArakGroundhog;
    list: ArakGroundhog;
    action: ArakGroundhog;
}

export interface ReturnedItemsAccounts {
    accData: null;
}

export interface RiskAssessmentData {
    authModeDetails: null;
    error: null;
    useCaseActionData: null;
    mode: null;
    fromPath: string;
    useCaseFalconRiskProfileInfo: string;
    smsOtp: EventList;
    smsStatus: null;
    eventList: EventList;
    eventListStatus: null;
    useCaseClearData: null;
    riskJwtToken: string;
}

export interface EventList {
    remainingOtp: boolean;
    verifyAttemptRemaining: boolean;
    refId: string;
}

export interface SearchPastPaymentsTransactions {
    pastPaymentsData: PastPaymentsData;
}

export interface PastPaymentsData {
    transactionsList: null;
    error: boolean;
    status: string;
}

export interface SecureMail {
    securemail: ArakGroundhog;
    accountSearchFilter: AccountSearchFilter;
    EnquiryDetails: PuneHedgehog;
    tranTypeDetails: PuneHedgehog;
}

export interface SecureMailFundsTransfer {
    pastTransfers: unknown[];
    fromAccountsList: unknown[];
    toAccountsList: unknown[];
    status: null;
    error: null;
}

export interface SecureMailPayAnyone {
    pastPayments: unknown[];
    eligiblePayAnyoneAccounts: unknown[];
    countryCodes: ContactPage;
    payeesList: ContactPage;
    status: null;
    error: null;
}

export interface SkipUnskipDeleteDetails {
    skip: ArakGroundhog;
    unskip: ArakGroundhog;
    delete: ArakGroundhog;
}

export interface SrType {
    srType: null;
    pageState: null;
}

export interface SuperAnnuationTokenData {
    state: SuperAnnuationTokenDataState;
}

export interface SuperAnnuationTokenDataState {
    state: PurpleState;
}

export interface PurpleState {
    state: FluffyState;
}

export interface FluffyState {
    state: TentacledState;
}

export interface TentacledState {
    state: { [key: string]: null };
}

export interface TdInterestData {
    TDAccountsList: ArakGroundhog;
    TDInterestSummary: ArakGroundhog;
}

export interface TilesPage {
    settings: ArakGroundhog;
}

export interface UpdateEmail {
    updateEmail: ArakGroundhog;
    setUpdateEmail: ArakGroundhog;
}

export interface ViewActivityLogs {
    searchData: ArakGroundhog;
    userListData: ArakGroundhog;
}

export interface ViewAuthorisePaymentsData {
    pendingApprovals: ArakGroundhog;
    rejectedExpiredPayments: ArakGroundhog;
    rejectTransactionData: ArakGroundhog;
    authorizeTransactionData: ArakGroundhog;
    sendForRepairData: ArakGroundhog;
    deleteTransactionData: ArakGroundhog;
    pendingApprovalsState: PendingApprovalsState;
}

export interface PendingApprovalsState {
    pageStatus: PageStatus;
}

export interface PageStatus {
    status: null;
    message: string;
    hostError: boolean;
    isChecked: boolean;
}

export interface ViewRepairPaymentsData {
    deleteTransactionData: ArakGroundhog;
}
