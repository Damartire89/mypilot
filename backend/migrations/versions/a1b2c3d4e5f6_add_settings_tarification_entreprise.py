"""add settings tarification et entreprise etendu

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-04-16

"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Tarification
    op.add_column('company_settings', sa.Column('default_km_rate', sa.String(10), nullable=True, server_default=''))
    op.add_column('company_settings', sa.Column('night_rate_multiplier', sa.String(10), nullable=True, server_default=''))
    op.add_column('company_settings', sa.Column('weekend_rate_multiplier', sa.String(10), nullable=True, server_default=''))
    op.add_column('company_settings', sa.Column('max_ride_amount_alert', sa.String(10), nullable=True, server_default=''))
    # Entreprise étendu
    op.add_column('company_settings', sa.Column('billing_email', sa.String(200), nullable=True, server_default=''))
    op.add_column('company_settings', sa.Column('zone_activite', sa.String(100), nullable=True, server_default=''))
    op.add_column('company_settings', sa.Column('numero_licence', sa.String(50), nullable=True, server_default=''))
    op.add_column('company_settings', sa.Column('iban', sa.String(40), nullable=True, server_default=''))


def downgrade() -> None:
    op.drop_column('company_settings', 'iban')
    op.drop_column('company_settings', 'numero_licence')
    op.drop_column('company_settings', 'zone_activite')
    op.drop_column('company_settings', 'billing_email')
    op.drop_column('company_settings', 'max_ride_amount_alert')
    op.drop_column('company_settings', 'weekend_rate_multiplier')
    op.drop_column('company_settings', 'night_rate_multiplier')
    op.drop_column('company_settings', 'default_km_rate')
