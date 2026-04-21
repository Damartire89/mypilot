"""add performance indexes on hot query paths

Revision ID: c1d2e3f4a5b6
Revises: b8c9d0e1f2a3
Create Date: 2026-04-21

Index multi-tenants : presque toutes les requêtes filtrent sur company_id.
Index composites (company_id, X) couvrent les patterns suivants :
- rides : filter company + tri ride_at, filter company + status, filter company + driver
- drivers/vehicles/users : filter company
- invitations : lookup token (déjà unique mais on s'assure de l'index)
- users.email : déjà unique
"""
from alembic import op

revision = 'c1d2e3f4a5b6'
down_revision = 'b8c9d0e1f2a3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rides — table la plus volumineuse, requêtes les plus fréquentes
    op.create_index('idx_rides_company_ride_at', 'rides', ['company_id', 'ride_at'])
    op.create_index('idx_rides_company_status', 'rides', ['company_id', 'status'])
    op.create_index('idx_rides_company_driver', 'rides', ['company_id', 'driver_id'])
    op.create_index('idx_rides_company_issued_at', 'rides', ['company_id', 'issued_at'])

    # Drivers / Vehicles — listings filtrés par company
    op.create_index('idx_drivers_company', 'drivers', ['company_id'])
    op.create_index('idx_vehicles_company', 'vehicles', ['company_id'])

    # Users — lookup par company (members list)
    op.create_index('idx_users_company', 'users', ['company_id'])

    # Invitations — lookup par company (list pending invites)
    op.create_index('idx_invitations_company', 'invitations', ['company_id'])


def downgrade() -> None:
    op.drop_index('idx_invitations_company', 'invitations')
    op.drop_index('idx_users_company', 'users')
    op.drop_index('idx_vehicles_company', 'vehicles')
    op.drop_index('idx_drivers_company', 'drivers')
    op.drop_index('idx_rides_company_issued_at', 'rides')
    op.drop_index('idx_rides_company_driver', 'rides')
    op.drop_index('idx_rides_company_status', 'rides')
    op.drop_index('idx_rides_company_ride_at', 'rides')
