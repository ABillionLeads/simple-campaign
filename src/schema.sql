-- Enable UUID generation (safe to re-run)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ────────────────────────────────────────────────────────────
-- CAMPAIGNS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,

  -- ES / filtering knobs
  api_key              text NOT NULL,
  query                jsonb NOT NULL,
  use_net_new          boolean NOT NULL DEFAULT true,
  exclude_campaign_ids uuid[] NOT NULL DEFAULT '{}',

  -- SMTP + rate-limit
  smtp                 jsonb NOT NULL,
  per_hour_limit       int  NOT NULL,

  created_at           timestamptz NOT NULL DEFAULT now(),
  -- campaign size
  audience_size int NOT NULL
);

CREATE INDEX IF NOT EXISTS campaigns_api_key_idx
  ON campaigns (api_key);

-- ────────────────────────────────────────────────────────────
-- CONTACTS (with optional ES reference)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  email       text NOT NULL,

  subject     text NOT NULL,
  body        text NOT NULL,

  sent_at     timestamptz,

  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_contacts_pending_idx
  ON campaign_contacts (campaign_id)
  WHERE sent_at IS NULL;
