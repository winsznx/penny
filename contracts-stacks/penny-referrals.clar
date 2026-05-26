;; penny-referrals — anyone can register a referrer once, earns free credits
;; for both parties. No owner gating, no whitelist — fully permissionless.

(define-constant ERR-SELF-REFER (err u700))
(define-constant ERR-ALREADY-REFERRED (err u701))
(define-constant ERR-ZERO-ADDRESS (err u702))

(define-map referrers principal principal)
(define-map referral-count principal uint)
(define-map free-credits principal uint)

(define-public (set-referrer (referrer principal))
  (begin
    (asserts! (not (is-eq referrer tx-sender)) ERR-SELF-REFER)
    (asserts! (is-none (map-get? referrers tx-sender)) ERR-ALREADY-REFERRED)
    (map-set referrers tx-sender referrer)
    (map-set referral-count referrer (+ (default-to u0 (map-get? referral-count referrer)) u1))
    (map-set free-credits referrer (+ (default-to u0 (map-get? free-credits referrer)) u1))
    (map-set free-credits tx-sender (+ (default-to u0 (map-get? free-credits tx-sender)) u1))
    (print { event: "referred", who: tx-sender, referrer: referrer })
    (ok true)))

(define-read-only (referrer-of (who principal))
  (map-get? referrers who))

(define-read-only (credits-of (who principal))
  (default-to u0 (map-get? free-credits who)))

(define-read-only (referrals-of (who principal))
  (default-to u0 (map-get? referral-count who)))
