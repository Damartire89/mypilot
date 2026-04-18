"""add index on audit_logs.action

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-04-18

Index sur audit_logs.action pour accélérer le filtre action côté superadmin
(ex: "change_role", "reset_password") — utile quand la table grossit.
"""
from alembic import op

revision = 'b8c9d0e1f2a3'
down_revision = 'a7b8c9d0e1f2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index('idx_audit_logs_action', 'audit_logs', ['action'])


def downgrade() -> None:
    op.drop_index('idx_audit_logs_action', 'audit_logs')
