;; penny-badges — milestone NFTs for message-volume tiers.
;; Anyone can claim once their on-chain message count crosses a threshold.
;; No owner gating except for setting the base URI.

(define-non-fungible-token penny-badge uint)

(define-constant ERR-NOT-EARNED (err u600))
(define-constant ERR-ALREADY-MINTED (err u601))
(define-constant ERR-NOT-OWNER (err u602))

(define-data-var owner principal tx-sender)
(define-data-var base-uri (string-ascii 96) "https://penny.timjosh507.workers.dev/api/badges/")
(define-data-var next-token-id uint u0)

(define-map minted { user: principal, threshold: uint } bool)

(define-public (claim-milestone (threshold uint) (messages-so-far uint))
  (let ((id (var-get next-token-id)))
    (asserts! (>= messages-so-far threshold) ERR-NOT-EARNED)
    (asserts! (is-none (map-get? minted { user: tx-sender, threshold: threshold })) ERR-ALREADY-MINTED)
    (try! (nft-mint? penny-badge id tx-sender))
    (map-set minted { user: tx-sender, threshold: threshold } true)
    (var-set next-token-id (+ id u1))
    (print { event: "claimed", id: id, who: tx-sender, threshold: threshold })
    (ok id)))

(define-public (set-base-uri (new-uri (string-ascii 96)))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR-NOT-OWNER)
    (var-set base-uri new-uri)
    (ok true)))

(define-read-only (get-token-uri (id uint))
  (ok (some (var-get base-uri))))

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? penny-badge id)))
