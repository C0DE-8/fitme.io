import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiClock, FiCopy, FiCreditCard, FiRefreshCw, FiUpload } from "react-icons/fi";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError, imageUrl } from "../../../lib/api";
import {
  createUserSubscription,
  getFlutterwaveBanks,
  getUserAccounts,
  getUserPlans,
  getUserSubscriptionStatus,
  getUserSubscriptions,
  resolveFlutterwaveAccount,
  updateUserSubscriptionPayer,
} from "../../../lib/api/userApi";
import styles from "./UserSubscribePage.module.css";

function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return value || "No price";

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function accountLogoUrl(account) {
  if (!account?.account_logo) return "";
  return imageUrl(`/uploads/account-logos/${account.account_logo}`);
}

export function UserSubscribePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState("");
  const [bankQuery, setBankQuery] = useState("");
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [payer, setPayer] = useState({
    payer_bank_name: "",
    payer_bank_code: "",
    payer_account_name: "",
    payer_account_number: "",
    payment_proof: null,
  });
  const [loading, setLoading] = useState(true);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksUnavailable, setBanksUnavailable] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastResolvedAccount = useRef("");

  const refreshSubscriptionStatus = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setCheckingStatus(true);

      try {
        const statusData = await getUserSubscriptionStatus();
        setSubscriptionStatus(statusData);

        if (statusData?.subscribed) {
          navigate("/dashboard", { replace: true });
        }

        return statusData;
      } catch (err) {
        if (!quiet) {
          toast.error(getApiError(err, "Unable to check your subscription status"), { title: "Status unavailable" });
        }
        return null;
      } finally {
        if (!quiet) setCheckingStatus(false);
      }
    },
    [navigate, toast]
  );

  useEffect(() => {
    let alive = true;

    async function loadSubscribeData() {
      setLoading(true);

      try {
        const [plansData, accountsData, statusData, banksResult] = await Promise.all([
          getUserPlans(),
          getUserAccounts(),
          getUserSubscriptionStatus(),
          getFlutterwaveBanks()
            .then((banksData) => ({ banks: banksData || [], unavailable: false }))
            .catch(() => ({ banks: [], unavailable: true })),
        ]);

        if (!alive) return;

        setPlans(plansData || []);
        setAccounts(accountsData || []);
        setBanks(banksResult.banks);
        setBanksUnavailable(banksResult.unavailable);
        setSubscriptionStatus(statusData);
        setSelectedPlan((plansData || [])[0]?.plan_name || "");
        setSelectedPaymentAccountId((accountsData || [])[0]?.id || "");

        if (statusData?.subscribed) {
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        if (alive) toast.error(getApiError(err, "Unable to load subscription options"), { title: "Subscription unavailable" });
      } finally {
        if (alive) {
          setBanksLoading(false);
          setLoading(false);
        }
      }
    }

    loadSubscribeData();

    return () => {
      alive = false;
    };
  }, [navigate, toast]);

  useEffect(() => {
    if (loading || subscriptionStatus?.subscribed) return undefined;

    const timer = window.setInterval(() => {
      refreshSubscriptionStatus({ quiet: true });
    }, 15000);

    return () => window.clearInterval(timer);
  }, [loading, refreshSubscriptionStatus, subscriptionStatus?.subscribed]);

  const selectedPlanDetails = useMemo(
    () => plans.find((plan) => plan.plan_name === selectedPlan) || null,
    [plans, selectedPlan]
  );

  const selectedPaymentAccount = useMemo(
    () => accounts.find((account) => String(account.id) === String(selectedPaymentAccountId)) || null,
    [accounts, selectedPaymentAccountId]
  );

  const filteredBanks = useMemo(() => {
    const query = bankQuery.trim().toLowerCase();
    if (!query) return banks.slice(0, 12);

    return banks
      .filter((bank) => bank.name?.toLowerCase().includes(query))
      .slice(0, 12);
  }, [bankQuery, banks]);

  function chooseAccount(account) {
    setSelectedPaymentAccountId(account.id);
  }

  async function copyValue(value, label) {
    const text = String(value || "").trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}.`, { title: "Copy failed" });
    }
  }

  function choosePayerBank(bankCode) {
    const bank = banks.find((item) => String(item.code) === String(bankCode));

    setPayer((current) => ({
      ...current,
      payer_bank_code: bankCode,
      payer_bank_name: bank?.name || current.payer_bank_name,
      payer_account_name: "",
    }));
    setBankQuery(bank?.name || "");
    setBankPickerOpen(false);
    lastResolvedAccount.current = "";
  }

  const resolvePayerAccount = useCallback(async ({ quiet = false } = {}) => {
    if (!payer.payer_bank_code || !payer.payer_account_number) {
      if (!quiet) {
        toast.error("Select your bank and enter your account number first.", { title: "Account not resolved" });
      }
      return;
    }

    const resolveKey = `${payer.payer_bank_code}:${payer.payer_account_number}`;
    if (quiet && lastResolvedAccount.current === resolveKey) return;

    setResolvingAccount(true);

    try {
      const account = await resolveFlutterwaveAccount({
        account_bank: payer.payer_bank_code,
        account_number: payer.payer_account_number,
      });

      setPayer((current) => ({
        ...current,
        payer_account_name: account?.account_name || current.payer_account_name,
        payer_account_number: account?.account_number || current.payer_account_number,
      }));
      lastResolvedAccount.current = resolveKey;
      if (!quiet) toast.success("Account name resolved.");
    } catch (err) {
      lastResolvedAccount.current = "";
      if (!quiet) toast.error(getApiError(err, "Unable to resolve account"), { title: "Account not resolved" });
    } finally {
      setResolvingAccount(false);
    }
  }, [payer.payer_account_number, payer.payer_bank_code, toast]);

  useEffect(() => {
    if (!payer.payer_bank_code || payer.payer_account_number.trim().length < 10) return undefined;

    const timer = window.setTimeout(() => {
      resolvePayerAccount({ quiet: true });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [payer.payer_account_number, payer.payer_bank_code, resolvePayerAccount]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedPlan || !selectedPaymentAccount || !payer.payment_proof || !payer.payer_bank_name || !payer.payer_account_name) {
      toast.error("Choose a plan, add payer details, and upload your payment proof.", { title: "Subscription not sent" });
      return;
    }

    setSaving(true);

    try {
      await createUserSubscription({
        plan_name: selectedPlan,
        payment_proof: payer.payment_proof,
      });

      const pendingSubscriptions = await getUserSubscriptions("pending");
      const pending = (pendingSubscriptions || []).find((item) => item.plan_name === selectedPlan) || pendingSubscriptions?.[0];

      if (pending?.id) {
        await updateUserSubscriptionPayer(pending.id, {
          payer_bank_name: payer.payer_bank_name,
          payer_account_name: payer.payer_account_name,
          payer_account_number: payer.payer_account_number || null,
        });
      }

      const latestStatus = await getUserSubscriptionStatus();
      setSubscriptionStatus(latestStatus);
      if (latestStatus?.subscribed) {
        navigate("/dashboard", { replace: true });
      }
      toast.success("Subscription request sent for admin review.");
    } catch (err) {
      toast.error(getApiError(err, "Unable to send subscription request"), { title: "Subscription not sent" });
    } finally {
      setSaving(false);
    }
  }

  const isActive = subscriptionStatus?.subscribed;
  const isPending = subscriptionStatus?.reason === "pending" || subscriptionStatus?.status === "pending";

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.loadingPanel} aria-live="polite">
          <span className={styles.loader} />
          <h1>Loading subscription</h1>
          <p>Checking your plans, payment accounts, and current approval status.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.kicker}>Subscription</p>
          <h1>Activate your fitme.io account</h1>
          <p>Choose a plan, pay into an admin account, then upload your proof for review.</p>
        </div>
        {isActive ? (
          <button type="button" onClick={() => navigate("/dashboard")}>
            Go to dashboard
          </button>
        ) : null}
      </div>

      <div className={styles.layout}>
        <aside className={styles.welcome}>
          <div className={styles.welcomeIcon}>F</div>
          <h2>How fitme.io works</h2>
          <ol>
            <li>
              <strong>Add your storage.</strong>
              <span>Save the ingredients you already have at home.</span>
            </li>
            <li>
              <strong>Ask fitme AI.</strong>
              <span>Get meal ideas based on your storage, budget, and food style.</span>
            </li>
            <li>
              <strong>Check what is missing.</strong>
              <span>Open meal details to see ingredients, costs, and preparation notes.</span>
            </li>
          </ol>
        </aside>

        <main className={styles.panel}>
          <div className={styles.statusBar}>
            {isActive ? <FiCheck aria-hidden="true" /> : <FiClock aria-hidden="true" />}
            <div>
              <strong>{isActive ? "Subscription active" : isPending ? "Review pending" : "Subscription required"}</strong>
              <span>
                {checkingStatus
                  ? "Checking your latest approval status..."
                  : subscriptionStatus?.message || "Subscribe to unlock meal planning tools."}
              </span>
            </div>
            <button
              className={styles.statusButton}
              disabled={checkingStatus}
              type="button"
              onClick={() => refreshSubscriptionStatus()}
            >
              <FiRefreshCw aria-hidden="true" />
              Check now
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <section>
              <h2>Choose a plan</h2>
              <div className={styles.planGrid}>
                {plans.map((plan) => (
                  <button
                    className={selectedPlan === plan.plan_name ? styles.planActive : styles.plan}
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.plan_name)}
                  >
                    <span>{plan.plan_name}</span>
                    <strong>{formatPrice(plan.price)}</strong>
                  </button>
                ))}
                {!loading && !plans.length ? <p className={styles.empty}>No plans are available yet.</p> : null}
              </div>
            </section>

            <section>
              <h2>Pay into one account</h2>
              {selectedPaymentAccount && selectedPlanDetails ? (
                <div className={styles.paymentSummary}>
                  <div>
                    <span>Amount to pay</span>
                    <strong>{formatPrice(selectedPlanDetails.price)}</strong>
                  </div>
                  <button type="button" onClick={() => copyValue(selectedPlanDetails.price, "Amount")}>
                    <FiCopy aria-hidden="true" />
                    Copy
                  </button>
                </div>
              ) : null}
              <div className={styles.accountGrid}>
                {accounts.map((account) => (
                  <article
                    className={String(selectedPaymentAccountId) === String(account.id) ? styles.accountActive : styles.account}
                    aria-pressed={String(selectedPaymentAccountId) === String(account.id)}
                    key={account.id}
                    onClick={() => chooseAccount(account)}
                  >
                    <span className={styles.logo}>
                      {account.account_logo ? <img alt="" src={accountLogoUrl(account)} /> : <FiCreditCard aria-hidden="true" />}
                    </span>
                    <span>
                      <strong>
                        <span>
                          <small>Bank name</small>
                          {account.bank_name}
                        </span>
                        <button
                          aria-label="Copy bank name"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            copyValue(account.bank_name, "Bank name");
                          }}
                        >
                          <FiCopy aria-hidden="true" />
                        </button>
                      </strong>
                      <small>
                        <span>Account name</span>
                        {account.account_name}
                      </small>
                      <em>
                        <span>
                          <small>Account number</small>
                          {account.account_number}
                        </span>
                        <button
                          aria-label="Copy account number"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            copyValue(account.account_number, "Account number");
                          }}
                        >
                          <FiCopy aria-hidden="true" />
                        </button>
                      </em>
                    </span>
                  </article>
                ))}
                {!loading && !accounts.length ? <p className={styles.empty}>No payment accounts are available yet.</p> : null}
              </div>
            </section>

            <section className={styles.payerGrid}>
              <h2>Your payment details</h2>
              <label>
                Payer bank name
                {banksLoading ? (
                  <input disabled value="Loading banks..." readOnly />
                ) : banks.length ? (
                  <div className={styles.bankPicker}>
                    <input
                      autoComplete="off"
                      value={bankQuery}
                      onBlur={() => window.setTimeout(() => setBankPickerOpen(false), 140)}
                      onChange={(event) => {
                        setBankQuery(event.target.value);
                        setBankPickerOpen(true);
                        setPayer((current) => ({
                          ...current,
                          payer_bank_code: "",
                          payer_bank_name: event.target.value,
                          payer_account_name: "",
                        }));
                        lastResolvedAccount.current = "";
                      }}
                      onFocus={() => setBankPickerOpen(true)}
                      placeholder="Type your bank name"
                    />
                    {bankPickerOpen ? (
                      <div className={styles.bankOptions}>
                        {filteredBanks.map((bank) => (
                          <button key={bank.code} type="button" onMouseDown={() => choosePayerBank(bank.code)}>
                            {bank.name}
                          </button>
                        ))}
                        {!filteredBanks.length ? <span>No matching banks</span> : null}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <input
                    value={payer.payer_bank_name}
                    onChange={(event) => setPayer((current) => ({ ...current, payer_bank_name: event.target.value }))}
                    placeholder="Bank you paid from"
                  />
                )}
              </label>
              {banksUnavailable ? (
                <p className={styles.inlineNotice}>
                  Bank list is unavailable right now. Type your bank name manually and continue.
                </p>
              ) : null}
              <label>
                Payer account number
                <input
                  value={payer.payer_account_number}
                  onChange={(event) => {
                    lastResolvedAccount.current = "";
                    setPayer((current) => ({
                      ...current,
                      payer_account_number: event.target.value.replace(/\D/g, "").slice(0, 20),
                      payer_account_name: "",
                    }));
                  }}
                  placeholder="Account number"
                />
              </label>
              <label>
                Payer account name
                <input
                  value={payer.payer_account_name}
                  onChange={(event) => setPayer((current) => ({ ...current, payer_account_name: event.target.value }))}
                  placeholder={resolvingAccount ? "Resolving automatically..." : "Name on your account"}
                />
              </label>
              <label>
                Payment proof
                <input
                  accept="image/*"
                  type="file"
                  onChange={(event) => setPayer((current) => ({ ...current, payment_proof: event.target.files?.[0] || null }))}
                />
              </label>
            </section>

            <button className={styles.primary} disabled={saving || isActive || isPending || !selectedPlanDetails} type="submit">
              <FiUpload aria-hidden="true" />
              {saving ? "Sending..." : isPending ? "Awaiting admin review" : "Submit for review"}
            </button>
          </form>
        </main>
      </div>
    </section>
  );
}
