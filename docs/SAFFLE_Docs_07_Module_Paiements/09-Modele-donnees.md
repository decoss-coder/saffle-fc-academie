# Modèle de données recommandé

## Table `player_dues`

Cette table représente les cotisations ou dettes dues par un joueur.

Champs recommandés :

- id
- player_id
- season_id
- due_type
- label
- amount_due
- amount_paid
- remaining_amount
- status
- due_date
- created_by
- created_at
- updated_at

## Table `payments`

Cette table représente les paiements effectués.

Champs recommandés :

- id
- player_due_id
- player_id
- payer_user_id
- payer_type
- amount
- payment_method
- status
- reference
- external_reference
- wave_checkout_url
- paid_at
- validated_at
- validated_by
- cancelled_at
- cancelled_by
- cancellation_reason
- receipt_number
- receipt_pdf_path
- created_at
- updated_at

## Table `payment_audit_logs`

Cette table permet de tracer les opérations sensibles.

Champs recommandés :

- id
- payment_id
- user_id
- action
- old_values
- new_values
- reason
- ip_address
- user_agent
- created_at
