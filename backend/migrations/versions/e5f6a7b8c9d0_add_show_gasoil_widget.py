"""add show_gasoil_widget on company_settings

Revision ID: e5f6a7b8c9d0
Revises: d5e6f7a8b9c0
Create Date: 2026-04-17

Option pour masquer le widget gasoil du Dashboard. Default True (rétro-compat).
"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f6a7b8c9d0'
down_revision = 'd5e6f7a8b9c0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'company_settings',
        sa.Column('show_gasoil_widget', sa.Boolean(), nullable=True, server_default=sa.true()),
    )


def downgrade() -> None:
    op.drop_column('company_settings', 'show_gasoil_widget')
