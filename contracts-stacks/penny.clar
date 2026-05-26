;; Penny - Stacks/Clarity port (draft)
;; Prepaid escrow that debits per-message based on registered tier rates.
;; Mirrors the Solidity Penny.sol: tier registry, topUp, selfRegisterMessage.

(define-constant ERR-TIER-INACTIVE (err u200))
(define-constant ERR-NOT-RELAY (err u201))
(define-constant ERR-ZERO-AMOUNT (err u202))
(define-constant ERR-INSUFFICIENT-BALANCE (err u203))
(define-constant ERR-ALREADY-REGISTERED (err u204))

(define-data-var owner principal tx-sender)
(define-data-var relay principal tx-sender)

(define-map balances principal uint)
(define-map tiers (buff 32) { base-cost: uint, active: bool })
(define-map pending-messages (buff 32) { user: principal, cost: uint, model: (buff 32) })

(define-public (top-up (amount uint))
  (let ((current (default-to u0 (map-get? balances tx-sender))))
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    ;; TODO: SIP-010 transfer from tx-sender to contract
    (map-set balances tx-sender (+ current amount))
    (ok true)))

(define-public (self-register-message (msg-hash (buff 32)) (model-id (buff 32)) (reported-cost uint))
  (let ((tier (map-get? tiers model-id))
        (current (default-to u0 (map-get? balances tx-sender))))
    (asserts! (is-some tier) ERR-TIER-INACTIVE)
    (asserts! (get active (unwrap! tier ERR-TIER-INACTIVE)) ERR-TIER-INACTIVE)
    (asserts! (is-none (map-get? pending-messages msg-hash)) ERR-ALREADY-REGISTERED)
    (asserts! (>= current reported-cost) ERR-INSUFFICIENT-BALANCE)
    (map-set balances tx-sender (- current reported-cost))
    (map-set pending-messages msg-hash { user: tx-sender, cost: reported-cost, model: model-id })
    (ok true)))

;; TODO: confirmBatch (relay-only)
;; TODO: dispute / resolve
;; TODO: lock-rate window

(define-read-only (balance-of (user principal))
  (default-to u0 (map-get? balances user)))

(define-read-only (get-tier (model-id (buff 32)))
  (map-get? tiers model-id))
