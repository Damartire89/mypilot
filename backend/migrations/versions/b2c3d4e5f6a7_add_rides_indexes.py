"""add rides performance indexes

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-16

"""
from alembic import op

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index('idx_rides_company_id', 'rides', ['company_id'])
    op.create_index('idx_rides_company_ride_at', 'rides', ['company_id', 'ride_at'])
    op.create_index('idx_rides_driver_id', 'rides', ['driver_id'])
    op.create_index('idx_rides_status', 'rides', ['status'])


def downgrade() -> None:
    op.drop_index('idx_rides_status', 'rides')
    op.drop_index('idx_rides_driver_id', 'rides')
    op.drop_index('idx_rides_company_ride_at', 'rides')
    op.drop_index('idx_rides_company_id', 'rides')
