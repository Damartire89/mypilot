"""add performance indexes on hot query paths

Revision ID: c1d2e3f4a5b6
Revises: b8c9d0e1f2a3
Create Date: 2026-04-21

Index complémentaires aux migrations b2c3d4e5f6a7 (rides) et a7b8c9d0e1f2 (users/invitations).
Ajoute uniquement les composites encore manquants et les company_id drivers/vehicles.
Utilise IF NOT EXISTS pour être idempotent en cas de réapplication.
"""
from alembic import op

revision = 'c1d2e3f4a5b6'
down_revision = 'b8c9d0e1f2a3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Composites rides manquants
    op.execute("CREATE INDEX IF NOT EXISTS idx_rides_company_status ON rides (company_id, status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_rides_company_driver ON rides (company_id, driver_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_rides_company_issued_at ON rides (company_id, issued_at)")

    # Drivers / Vehicles — pas encore indexés sur company_id
    op.execute("CREATE INDEX IF NOT EXISTS idx_drivers_company ON drivers (company_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_vehicles_company ON vehicles (company_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_vehicles_company")
    op.execute("DROP INDEX IF EXISTS idx_drivers_company")
    op.execute("DROP INDEX IF EXISTS idx_rides_company_issued_at")
    op.execute("DROP INDEX IF EXISTS idx_rides_company_driver")
    op.execute("DROP INDEX IF EXISTS idx_rides_company_status")
