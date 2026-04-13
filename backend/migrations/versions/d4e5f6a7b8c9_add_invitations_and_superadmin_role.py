"""add_invitations_and_superadmin_role

Revision ID: d4e5f6a7b8c9
Revises: c3d1a7e8f921
Create Date: 2026-04-13 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d1a7e8f921'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'invitations',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('email', sa.String(200), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, server_default='manager'),
        sa.Column('token', sa.String(64), nullable=False, unique=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_invitations_token', 'invitations', ['token'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_invitations_token', 'invitations')
    op.drop_table('invitations')
