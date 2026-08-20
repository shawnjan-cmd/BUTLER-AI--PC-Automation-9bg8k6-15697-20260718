import unittest

from butler_server import PAIRING_STATE, automation_flow, observatory, script_workshop, vault


class ButlerMonitoredCreationFlowTest(unittest.TestCase):
    """A harmless script-creation message traced through the real guarded server path."""

    def setUp(self):
        self.original_pair = dict(PAIRING_STATE)
        self.original_lock = vault.locked
        self.original_events = list(observatory.events)
        PAIRING_STATE.update({"is_paired": True, "paired_device_id": "monitored-test-phone"})
        vault.locked = False
        observatory.events.clear()
        self.script_id = "butler_harmless_creation_test.py"
        target = script_workshop.sandbox_dir / self.script_id
        if target.exists():
            target.unlink()

    def tearDown(self):
        PAIRING_STATE.clear()
        PAIRING_STATE.update(self.original_pair)
        vault.locked = self.original_lock
        observatory.events[:] = self.original_events
        target = script_workshop.sandbox_dir / self.script_id
        if target.exists():
            target.unlink()

    def test_message_to_receipt_with_observatory_trace(self):
        request = "Create a harmless Python script that prints a Butler workflow self-test result. Do not change files or use the network."
        plan = automation_flow.plan_request(request)
        self.assertEqual(plan["status"], "ready")
        self.assertEqual(plan["plan"]["risk"], "local_change")
        self.assertTrue(plan["plan"]["requiresExplicitApproval"])

        # This is the reviewed draft produced for the test. It is intentionally
        # non-destructive, deterministic, network-free, and emits one line only.
        draft = automation_flow.save_draft(self.script_id, "print('BUTLER_SAFE_DRAFT_OK')\n", plan["plan"]["planId"])
        self.assertEqual(draft["status"], "draft_saved")

        intent = automation_flow.begin_intent(self.script_id, {
            "scope": ["allowlisted_script", "declared_paths", "time_budget", "resource_budget"],
            "risk": "side_effect",
        })
        self.assertEqual(intent["status"], "ready_for_approval")
        self.assertEqual(intent["dryRun"]["status"], "DRY_RUN_PASSED")

        # Test harness explicitly represents the user approval boundary. Chat
        # planning itself never calls this server method.
        approval = automation_flow.approve_intent(intent["intent"]["ledgerId"], intent["intent"]["intentDigest"])
        self.assertEqual(approval["status"], "approved")
        execution = automation_flow.execute_approved(approval["approvalToken"])
        self.assertTrue(execution["success"])
        self.assertIn("BUTLER_SAFE_DRAFT_OK", execution["output"])
        self.assertEqual(execution["receipt"]["payload"]["outcome"], "succeeded")

        categories = [event["category"] for event in observatory.get_snapshot()["recent_events"]]
        for expected in ("AUTOMATION_PLAN", "SCRIPT_DRAFT", "FLOW_INTENT", "FLOW_APPROVAL", "FLOW_RECEIPT"):
            self.assertIn(expected, categories, f"Missing structured observatory event: {expected}")


if __name__ == "__main__":
    unittest.main()
